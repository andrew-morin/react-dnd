"use strict";
var _index = require("../index");
describe('TouchBackend', ()=>{
    it('can be constructed', ()=>{
        const backend = (0, _index).TouchBackend(mockManager(), {}, {});
        expect(backend).toBeDefined();
    });
    it('can be constructed', ()=>{
        const backend = (0, _index).TouchBackend(mockManager(), {}, {});
        expect(backend).toBeDefined();
        const profile = backend.profile();
        expect(profile).toBeDefined();
        Object.keys(profile).forEach((profilingKey)=>expect(profile[profilingKey]).toEqual(0)
        );
    });
    it('can determine target ids', ()=>{
        const mockNode1 = {};
        const mockNode2 = {};
        const backend = (0, _index).TouchBackend(mockManager(), {}, {});
        backend.targetNodes.set('abc', mockNode1);
        backend.targetNodes.set('def', mockNode2);
        expect(backend._getDropTargetId(mockNode1)).toEqual('abc');
        expect(backend._getDropTargetId(mockNode2)).toEqual('def');
        expect(backend._getDropTargetId({})).toEqual(undefined);
    });
});
function mockManager() {
    return {
        getActions: ()=>null
        ,
        getMonitor: ()=>null
        ,
        getRegistry: ()=>null
    };
}

//# sourceMappingURL=TouchBackend.spec.js.map