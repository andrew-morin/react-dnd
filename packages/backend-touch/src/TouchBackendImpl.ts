import { invariant } from '@react-dnd/invariant'
import {
	DragDropActions,
	DragDropMonitor,
	Backend,
	Identifier,
	XYCoord,
	DragDropManager,
	Unsubscribe,
} from 'dnd-core'
import {
	EventName,
	ListenerType,
	TouchBackendOptions,
	TouchBackendContext,
} from './interfaces'
import {
	eventShouldStartDrag,
	eventShouldEndDrag,
	isTouchEvent,
} from './utils/predicates'
import { getEventClientOffset, getNodeClientOffset } from './utils/offsets'
import { distance, inAngleRanges } from './utils/math'
import { supportsPassive } from './utils/supportsPassive'
import { OptionsReader } from './OptionsReader'

const eventNames: Record<ListenerType, EventName> = {
	[ListenerType.mouse]: {
		start: 'mousedown',
		move: 'mousemove',
		end: 'mouseup',
		contextmenu: 'contextmenu',
	},
	[ListenerType.touch]: {
		start: 'touchstart',
		move: 'touchmove',
		end: 'touchend',
	},
	[ListenerType.keyboard]: {
		keydown: 'keydown',
	},
}

export class TouchBackendImpl implements Backend {
	private options: OptionsReader

	// React-DnD Dependencies
	private actions: DragDropActions
	private monitor: DragDropMonitor

	// Internal State
	private static isSetUp: boolean
	public sourceNodes: Map<Identifier, HTMLElement>
	public sourcePreviewNodes: Map<string, HTMLElement>
	public sourcePreviewNodeOptions: Map<string, any>
	public targetNodes: Map<string, HTMLElement>
	private _mouseClientOffset: Partial<XYCoord>
	private _isScrolling: boolean
	private listenerTypes: ListenerType[]
	private moveStartSourceIds: string[] | undefined
	private waitingForDelay: boolean | undefined
	private timeout: ReturnType<typeof setTimeout> | undefined
	private dragOverTargetIds: string[] | undefined
	private draggedSourceNode: HTMLElement | undefined
	private draggedSourceNodeRemovalObserver: MutationObserver | undefined
	private lastMoveEvent: TouchEvent | MouseEvent | undefined
	private shouldRequestMoveFrame: boolean

	// Patch for iOS 13, discussion over #1585
	private lastTargetTouchFallback: Touch | undefined

	public constructor(
		manager: DragDropManager,
		context: TouchBackendContext,
		options: Partial<TouchBackendOptions>,
	) {
		this.options = new OptionsReader(options, context)
		this.actions = manager.getActions()
		this.monitor = manager.getMonitor()

		this.sourceNodes = new Map()
		this.sourcePreviewNodes = new Map()
		this.sourcePreviewNodeOptions = new Map()
		this.targetNodes = new Map()
		this.listenerTypes = []
		this._mouseClientOffset = {}
		this._isScrolling = false
		this.shouldRequestMoveFrame = true

		if (this.options.enableMouseEvents) {
			this.listenerTypes.push(ListenerType.mouse)
		}

		if (this.options.enableTouchEvents) {
			this.listenerTypes.push(ListenerType.touch)
		}

		if (this.options.enableKeyboardEvents) {
			this.listenerTypes.push(ListenerType.keyboard)
		}
	}

	/**
	 * Generate profiling statistics for the HTML5Backend.
	 */
	public profile(): Record<string, number> {
		return {
			sourceNodes: this.sourceNodes.size,
			sourcePreviewNodes: this.sourcePreviewNodes.size,
			sourcePreviewNodeOptions: this.sourcePreviewNodeOptions.size,
			targetNodes: this.targetNodes.size,
			dragOverTargetIds: this.dragOverTargetIds?.length || 0,
		}
	}

	// public for test
	public get document(): Document | undefined {
		return this.options.document
	}

	public setup(): void {
		const root = this.options.rootElement
		if (!root) {
			return
		}

		invariant(
			!TouchBackendImpl.isSetUp,
			'Cannot have two Touch backends at the same time.',
		)
		TouchBackendImpl.isSetUp = true

		this.addEventListener(root, 'start', this.getTopMoveStartHandler() as any)
		this.addEventListener(
			root,
			'start',
			this.handleTopMoveStartCapture as any,
			true,
		)
		this.addEventListener(root, 'move', this.handleTopMove as any)
		this.addEventListener(
			root,
			'end',
			this.handleTopMoveEndCapture as any,
			true,
		)

		if (this.options.enableMouseEvents && !this.options.ignoreContextMenu) {
			this.addEventListener(
				root,
				'contextmenu',
				this.handleTopMoveEndCapture as any,
			)
		}

		if (this.options.enableKeyboardEvents) {
			this.addEventListener(
				root,
				'keydown',
				this.handleCancelOnEscape as any,
				true,
			)
		}
	}

	public teardown(): void {
		const root = this.options.rootElement
		if (!root) {
			return
		}

		TouchBackendImpl.isSetUp = false
		this._mouseClientOffset = {}

		this.removeEventListener(
			root,
			'start',
			this.handleTopMoveStartCapture as any,
			true,
		)
		this.removeEventListener(root, 'start', this.handleTopMoveStart as any)
		this.removeEventListener(root, 'move', this.handleTopMove as any)
		this.removeEventListener(
			root,
			'end',
			this.handleTopMoveEndCapture as any,
			true,
		)

		if (this.options.enableMouseEvents && !this.options.ignoreContextMenu) {
			this.removeEventListener(
				root,
				'contextmenu',
				this.handleTopMoveEndCapture as any,
			)
		}

		if (this.options.enableKeyboardEvents) {
			this.removeEventListener(
				root,
				'keydown',
				this.handleCancelOnEscape as any,
				true,
			)
		}

		this.uninstallSourceNodeRemovalObserver()
	}

	private addEventListener<K extends keyof EventName>(
		subject: Node,
		event: K,
		handler: (e: any) => void,
		capture?: boolean,
	) {
		const options = supportsPassive ? { capture, passive: false } : capture

		this.listenerTypes.forEach(function (listenerType) {
			const evt = eventNames[listenerType][event]

			if (evt) {
				subject.addEventListener(evt as any, handler as any, options)
			}
		})
	}

	private removeEventListener<K extends keyof EventName>(
		subject: Node,
		event: K,
		handler: (e: any) => void,
		capture?: boolean,
	) {
		const options = supportsPassive ? { capture, passive: false } : capture

		this.listenerTypes.forEach(function (listenerType) {
			const evt = eventNames[listenerType][event]

			if (evt) {
				subject.removeEventListener(evt as any, handler as any, options)
			}
		})
	}

	public connectDragSource(sourceId: string, node: HTMLElement): Unsubscribe {
		const handleMoveStart = this.handleMoveStart.bind(this, sourceId)
		this.sourceNodes.set(sourceId, node)

		this.addEventListener(node, 'start', handleMoveStart)

		return (): void => {
			this.sourceNodes.delete(sourceId)
			this.removeEventListener(node, 'start', handleMoveStart)
		}
	}

	public connectDragPreview(
		sourceId: string,
		node: HTMLElement,
		options: unknown,
	): Unsubscribe {
		this.sourcePreviewNodeOptions.set(sourceId, options)
		this.sourcePreviewNodes.set(sourceId, node)

		return (): void => {
			this.sourcePreviewNodes.delete(sourceId)
			this.sourcePreviewNodeOptions.delete(sourceId)
		}
	}

	public connectDropTarget(targetId: string, node: HTMLElement): Unsubscribe {
		const root = this.options.rootElement
		if (!this.document || !root) {
			return (): void => {
				/* noop */
			}
		}
		this.targetNodes.set(targetId, node)

		return (): void => {
			if (this.document) {
				this.targetNodes.delete(targetId)
			}
		}
	}

	private getSourceClientOffset = (sourceId: string): XYCoord | undefined => {
		const element = this.sourceNodes.get(sourceId)
		return element && getNodeClientOffset(element)
	}

	public handleTopMoveStartCapture = (e: Event): void => {
		if (!eventShouldStartDrag(e as MouseEvent)) {
			return
		}

		this.moveStartSourceIds = []
	}

	public handleMoveStart = (sourceId: string): void => {
		// Just because we received an event doesn't necessarily mean we need to collect drag sources.
		// We only collect start collecting drag sources on touch and left mouse events.
		if (Array.isArray(this.moveStartSourceIds)) {
			this.moveStartSourceIds.unshift(sourceId)
		}
	}

	private getTopMoveStartHandler() {
		if (!this.options.delayTouchStart && !this.options.delayMouseStart) {
			return this.handleTopMoveStart
		}

		return this.handleTopMoveStartDelay
	}

	public handleTopMoveStart = (e: MouseEvent | TouchEvent): void => {
		if (!eventShouldStartDrag(e as MouseEvent)) {
			return
		}

		// Don't prematurely preventDefault() here since it might:
		// 1. Mess up scrolling
		// 2. Mess up long tap (which brings up context menu)
		// 3. If there's an anchor link as a child, tap won't be triggered on link

		const clientOffset = getEventClientOffset(e)
		if (clientOffset) {
			if (isTouchEvent(e)) {
				this.lastTargetTouchFallback = e.targetTouches[0]
			}
			this._mouseClientOffset = clientOffset
		}
		this.waitingForDelay = false
	}

	public handleTopMoveStartDelay = (e: Event): void => {
		if (!eventShouldStartDrag(e as MouseEvent)) {
			return
		}

		const delay =
			e.type === eventNames.touch.start
				? this.options.delayTouchStart
				: this.options.delayMouseStart
		this.timeout = setTimeout(
			this.handleTopMoveStart.bind(this, e as any),
			delay,
		) as any as ReturnType<typeof setTimeout>
		this.waitingForDelay = true
	}

	public handleTopMove = (e: TouchEvent | MouseEvent): void => {
		if (this.timeout) {
			clearTimeout(this.timeout)
		}
		if (!this.document || this.waitingForDelay) {
			return
		}
		const { moveStartSourceIds } = this

		const clientOffset = getEventClientOffset(e, this.lastTargetTouchFallback)

		if (!clientOffset) {
			return
		}

		// If the touch move started as a scroll, or is is between the scroll angles
		if (
			this._isScrolling ||
			(!this.monitor.isDragging() &&
				inAngleRanges(
					this._mouseClientOffset.x || 0,
					this._mouseClientOffset.y || 0,
					clientOffset.x,
					clientOffset.y,
					this.options.scrollAngleRanges,
				))
		) {
			this._isScrolling = true
			return
		}

		// If we're not dragging and we've moved a little, that counts as a drag start
		if (
			!this.monitor.isDragging() &&
			// eslint-disable-next-line no-prototype-builtins
			this._mouseClientOffset.hasOwnProperty('x') &&
			moveStartSourceIds &&
			distance(
				this._mouseClientOffset.x || 0,
				this._mouseClientOffset.y || 0,
				clientOffset.x,
				clientOffset.y,
			) > (this.options.touchSlop ? this.options.touchSlop : 0)
		) {
			this.moveStartSourceIds = undefined

			this.actions.beginDrag(moveStartSourceIds, {
				clientOffset: this._mouseClientOffset,
				getSourceClientOffset: this.getSourceClientOffset,
				publishSource: false,
			})
		}

		if (!this.monitor.isDragging()) {
			return
		}

		const sourceNode = this.sourceNodes.get(
			this.monitor.getSourceId() as string,
		)
		this.installSourceNodeRemovalObserver(sourceNode)
		this.actions.publishDragSource()

		if (e.cancelable) e.preventDefault()

		this.lastMoveEvent = e

		if (this.shouldRequestMoveFrame) {
			this.shouldRequestMoveFrame = false
			requestAnimationFrame(this.handleTopMoveStream)
		}
	}

	public handleTopMoveStream = (): void => {
		this.shouldRequestMoveFrame = true

		if (!this.document || !this.monitor.isDragging() || !this.lastMoveEvent) {
			return
		}

		const clientOffset = getEventClientOffset(this.lastMoveEvent)

		if (!clientOffset) {
			return
		}

		// If we have a drag blocking element, ignore it when finding the target element
		const dragBlocker =
			this.options.mouseBlockDivId &&
			document.getElementById(this.options.mouseBlockDivId)
		if (dragBlocker) {
			dragBlocker.style.setProperty('pointer-events', 'none')
		}

		const targetElement = document.elementFromPoint(
			clientOffset.x,
			clientOffset.y,
		)

		if (dragBlocker) {
			dragBlocker.style.setProperty('pointer-events', 'auto')
		}

		const targetNodes = this.targetNodes
		const dragOverTargetNodes: HTMLElement[] = []
		targetNodes.forEach(function (node) {
			if (targetElement === node || node?.contains(targetElement)) {
				dragOverTargetNodes.push(node)
			}
		})

		// Get the a ordered list of nodes that are touched by
		const elementsAtPoint = this.options.getDropTargetElementsAtPoint
			? this.options.getDropTargetElementsAtPoint(
					clientOffset.x,
					clientOffset.y,
					dragOverTargetNodes,
			  )
			: this.document.elementsFromPoint(clientOffset.x, clientOffset.y)
		// Extend list with parents that are not receiving elementsFromPoint events (size 0 elements and svg groups)
		const elementsAtPointExtended: Element[] = []
		for (const nodeId in elementsAtPoint) {
			// eslint-disable-next-line no-prototype-builtins
			if (!elementsAtPoint.hasOwnProperty(nodeId)) {
				continue
			}
			let currentNode: Element | null = elementsAtPoint[nodeId]
			elementsAtPointExtended.push(currentNode)
			while (currentNode) {
				currentNode = currentNode.parentElement
				if (
					currentNode &&
					elementsAtPointExtended.indexOf(currentNode) === -1
				) {
					elementsAtPointExtended.push(currentNode)
				}
			}
		}
		const orderedDragOverTargetIds: string[] = elementsAtPointExtended
			// Filter off nodes that arent a hovered DropTargets nodes
			.filter((node) => dragOverTargetNodes.indexOf(node as HTMLElement) > -1)
			// Map back the nodes elements to targetIds
			.map((node) => this._getDropTargetId(node))
			// Filter off possible null rows
			.filter((node) => !!node)
			.filter((id, index, ids) => ids.indexOf(id) === index) as string[]

		const enableHoverOutsideTarget = this.options.enableHoverOutsideTarget
		// Invoke hover for drop targets when source node is still over and pointer is outside
		if (enableHoverOutsideTarget) {
			const sourceNode = this.sourceNodes.get(
				this.monitor.getSourceId() as string,
			)
			for (const targetId in this.targetNodes) {
				const targetNode = this.targetNodes.get(targetId)
				if (
					sourceNode &&
					targetNode &&
					targetNode.contains(sourceNode) &&
					orderedDragOverTargetIds.indexOf(targetId) === -1
				) {
					orderedDragOverTargetIds.unshift(targetId)
					break
				}
			}
		}

		// Reverse order because dnd-core reverse it before calling the DropTarget drop methods
		orderedDragOverTargetIds.reverse()

		this.actions.hover(orderedDragOverTargetIds, {
			clientOffset: clientOffset,
		})
	}

	/**
	 *
	 * visible for testing
	 */
	public _getDropTargetId = (node: Element): Identifier | undefined => {
		const keys = this.targetNodes.keys()
		let next = keys.next()
		while (next.done === false) {
			const targetId = next.value
			if (node === this.targetNodes.get(targetId)) {
				return targetId
			} else {
				next = keys.next()
			}
		}
		return undefined
	}

	public handleTopMoveEndCapture = (e: Event): void => {
		this._isScrolling = false
		this.lastTargetTouchFallback = undefined

		if (!eventShouldEndDrag(e as MouseEvent)) {
			return
		}

		if (!this.monitor.isDragging() || this.monitor.didDrop()) {
			this.moveStartSourceIds = undefined
			return
		}

		if (e.cancelable) e.preventDefault()

		this._mouseClientOffset = {}

		this.uninstallSourceNodeRemovalObserver()
		this.actions.drop()
		this.actions.endDrag()
	}

	public handleCancelOnEscape = (e: KeyboardEvent): void => {
		if (e.key === 'Escape' && this.monitor.isDragging()) {
			this._mouseClientOffset = {}

			this.uninstallSourceNodeRemovalObserver()
			this.actions.endDrag()
		}
	}

	private installSourceNodeRemovalObserver(node: HTMLElement | undefined) {
		this.uninstallSourceNodeRemovalObserver()

		this.draggedSourceNode = node
		this.draggedSourceNodeRemovalObserver = new MutationObserver(() => {
			if (node && !node.parentElement) {
				this.resurrectSourceNode()
				this.uninstallSourceNodeRemovalObserver()
			}
		})

		if (!node || !node.parentElement) {
			return
		}

		this.draggedSourceNodeRemovalObserver.observe(node.parentElement, {
			childList: true,
		})
	}

	private resurrectSourceNode() {
		if (this.document && this.draggedSourceNode) {
			this.draggedSourceNode.style.display = 'none'
			this.draggedSourceNode.removeAttribute('data-reactid')
			this.document.body.appendChild(this.draggedSourceNode)
		}
	}

	private uninstallSourceNodeRemovalObserver() {
		if (this.draggedSourceNodeRemovalObserver) {
			this.draggedSourceNodeRemovalObserver.disconnect()
		}

		this.draggedSourceNodeRemovalObserver = undefined
		this.draggedSourceNode = undefined
	}
}
