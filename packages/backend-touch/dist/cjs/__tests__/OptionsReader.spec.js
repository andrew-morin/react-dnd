"use strict";
var _optionsReader = require("../OptionsReader");
describe('The Touch Backend Options Reader', ()=>{
    it('can be constructed and emits some defaults', ()=>{
        const options = new _optionsReader.OptionsReader({});
        expect(options.delayTouchStart).toEqual(0);
        expect(options.delayMouseStart).toEqual(0);
        expect(options.enableMouseEvents).toEqual(false);
        expect(options.enableTouchEvents).toEqual(true);
    });
});

//# sourceMappingURL=OptionsReader.spec.js.map