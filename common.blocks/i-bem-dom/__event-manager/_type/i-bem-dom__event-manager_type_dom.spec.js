modules.define(
    'spec',
    ['i-bem', 'i-bem-dom', 'objects', 'jquery', 'chai', 'sinon', 'BEMHTML'],
    function(provide, BEM, BEMDOM, objects, $, chai, sinon, BEMHTML) {

var undef,
    expect = chai.expect;

describe.only('DOM events', function() {
    var Block1, Block2, block1, spy1, spy2, spy3, spy4, spy5, spy6, spy7,
        wrapSpy = function(spy) {
            return function(e) {
                // NOTE: we need to pass bemTarget explicitly, as `e` is being
                // changed while event is propagating
                spy.call(this, e, e.bemTarget);
            };
        },
        data = { data : 'data' };

    beforeEach(function() {
        spy1 = sinon.spy();
        spy2 = sinon.spy();
        spy3 = sinon.spy();
        spy4 = sinon.spy();
        spy5 = sinon.spy();
        spy6 = sinon.spy();
        spy7 = sinon.spy();
    });

    afterEach(function() {
        BEMDOM.destruct(BEMDOM.scope, true);

        objects.each(BEM.entities, function(_, entityName) {
            delete BEM.entities[entityName];
        });
    });

    describe('on instance events', function() {
        describe('block domElem events', function() {
            beforeEach(function() {
                Block1 = BEMDOM.declBlock('block1', {
                    onSetMod : {
                        'js' : {
                            'inited' : function() {
                                this.domEvents()
                                    .on('click', spy1)
                                    .on('click', spy2)
                                    .on('click', data, spy3)
                                    .on({ 'click' : spy4 }, data);
                            }
                        }
                    }
                });

                Block2 = BEMDOM.declBlock('block2', {
                    onSetMod : {
                        'js' : {
                            'inited' : function() {
                                this.domEvents()
                                    .on('click', spy5);
                            }
                        }
                    }
                });

                block1 = createDomNode({
                    block : 'block1',
                    mix : { block : 'block2', js : true }
                }).bem(Block1);
            });

            it('should properly bind handlers', function() {
                block1.domElem.trigger('click');

                spy1.should.have.been.called;
                spy2.should.have.been.called;

                spy3.should.have.been.calledOn(block1);
                spy3.args[0][0].bemTarget.should.be.instanceOf(Block1);
                spy3.args[0][0].data.should.have.been.equal(data);
                spy4.args[0][0].data.should.have.been.equal(data);
            });

            it('should properly unbind all handlers', function() {
                block1.domEvents().un('click');
                block1.domElem.trigger('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
            });

            it('should properly unbind specified handler', function() {
                block1.domEvents().un('click', spy1);
                block1.domEvents().un({'click' : spy2});
                block1.domElem.trigger('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
                spy3.should.have.been.called;
            });

            it('should unbind only own handlers', function() {
                block1.domEvents().un('click');
                block1.domElem.trigger('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;

                spy5.should.have.been.called;
            });
        });

        describe('block elems events', function() {
            ['string', 'Class'].forEach(function(elemType) {
                var elem1, elem2;

                describe('elem as ' + elemType, function() {
                    var Elem1, Elem2;

                    beforeEach(function() {
                        elem1 = elemType === 'string'?
                            'e1' :
                            BEMDOM.declElem('block', 'e1');

                        Block1 = BEMDOM.declBlock('block', {
                            onSetMod : {
                                'js' : {
                                    'inited' : function() {
                                        this.domEvents(elem1)
                                            .on('click', spy1)
                                            .on('click', spy2)
                                            .on('click', data, spy3)
                                            .on({ 'click' : spy4 }, data);

                                        this.domEvents('e2').on('click', spy5);
                                    }
                                }
                            }
                        });

                        Elem1 = elemType === 'string'?
                            BEMDOM.declElem('block', 'e1') :
                            elem1;
                        Elem2 = BEMDOM.declElem('block', 'e2', {
                            onSetMod : {
                                'js' : {
                                    'inited' : function() {
                                        this.domEvents(elem1)
                                            .on('click', wrapSpy(spy6))
                                            .on('click', spy7);
                                    }
                                }
                            }
                        });

                        block1 = createDomNode({
                            block : 'block',
                            content : [
                                { elem : 'e1', content : { elem : 'e3' } },
                                { elem : 'e2', content : { elem : 'e1' } }
                            ]
                        }).bem(Block1);

                        elem2 = block1.elem('e2');
                    });

                    describe('block', function() {
                        it('should properly bind handlers', function() {
                            block1.elem('e3').domElem.trigger('click');

                            spy1.should.have.been.called;
                            spy1.should.have.been.calledOn(block1);

                            spy2.should.have.been.called;

                            spy3.should.have.been.called;
                            spy3.args[0][0].data.should.have.been.equal(data);
                            spy3.args[0][0].bemTarget.should.be.instanceOf(Elem1);
                            spy3.args[0][0].bemTarget.domElem[0]
                                .should.be.equal(block1.elem(elem1).domElem[0]);

                            spy4.should.have.been.called;
                            spy4.args[0][0].data.should.have.been.equal(data);

                            spy5.should.not.have.been.called;
                        });

                        it('should properly unbind all handlers', function() {
                            block1.domEvents(elem1).un('click');
                            block1.elem(elem1).domElem.trigger('click');

                            spy1.should.not.have.been.called;
                            spy2.should.not.have.been.called;
                            spy3.should.not.have.been.called;

                            elem2.domElem.trigger('click');

                            spy5.should.have.been.called;
                        });

                        it('should properly unbind specified handler', function() {
                            block1.domEvents(elem1).un('click', spy2);
                            block1.elem(elem1).domElem.trigger('click');

                            spy1.should.have.been.called;
                            spy2.should.not.have.been.called;
                            spy3.should.have.been.called;
                        });
                    });

                    describe('elem instance', function() {
                        it('should properly bind handlers', function() {
                            var e2elem1 = elem2.findChildElem('e1');
                            e2elem1.domElem.trigger('click');

                            spy6.should.have.been.called;
                            spy6.should.have.been.calledOn(elem2);
                            spy6.args[0][1].should.be.instanceOf(Elem1);
                            spy6.args[0][1].domElem[0]
                                .should.be.equal(e2elem1.domElem[0]);

                            spy7.should.have.been.called;
                        });

                        it('should properly unbind all handlers', function() {
                            elem2.domEvents(elem1).un('click');

                            var e2elem1 = elem2.findChildElem('e1');
                            e2elem1.domElem.trigger('click');

                            spy6.should.not.have.been.called;
                            spy7.should.not.have.been.called;
                        });

                        it('should properly unbind specified handler', function() {
                            elem2.domEvents(elem1).un('click', spy7);

                            var e2elem1 = elem2.findChildElem('e1');
                            e2elem1.domElem.trigger('click');

                            spy6.should.have.been.called;
                            spy7.should.not.have.been.called;
                        });
                    });
                });

                describe('elem as ' + elemType + ', modName, modVal', function() {
                    beforeEach(function() {
                        Block1 = BEMDOM.declBlock('block', {
                            onSetMod : {
                                'js' : {
                                    'inited' : function() {
                                        this.domEvents({ elem : elem1 })
                                            .on('click', spy1);
                                        this.domEvents({ elem : elem1, modName : 'm1', modVal : 'v1' })
                                            .on('click', spy2)
                                            .on('click', spy3);
                                    }
                                }
                            }
                        });

                        block1 = createDomNode({
                            block : 'block',
                            content : [
                                { elem : 'e1' },
                                { elem : 'e1', elemMods : { m1 : 'v1' } }
                            ]
                        }).bem(Block1);
                    });

                    it('should properly bind handlers', function() {
                        block1.elem({ elem : 'e1', modName : 'm1', modVal : 'v1' }).domElem.trigger('click');

                        spy1.should.have.been.called;
                        spy2.should.have.been.called;

                        block1.elem('e1').domElem.trigger('click');

                        spy1.should.have.been.calledTwice;
                        spy2.should.have.been.calledOnce;
                    });

                    it('should properly unbind all handlers', function() {
                        block1.domEvents({ elem : elem1, modName : 'm1', modVal : 'v1' }).un('click');

                        block1.elem({ elem : 'e1', modName : 'm1', modVal : 'v1' }).domElem.trigger('click');

                        spy1.should.have.been.called;
                        spy2.should.not.have.been.called;
                    });

                    it('should properly unbind specified handler', function() {
                        block1.domEvents({ elem : elem1, modName : 'm1', modVal : 'v1' }).un('click', spy2);

                        block1.elem({ elem : 'e1', modName : 'm1', modVal : 'v1' }).domElem.trigger('click');

                        spy1.should.have.been.called;
                        spy2.should.not.have.been.called;
                        spy3.should.have.been.called;
                    });
                });
            });
        });

        describe('document events', function() {
            beforeEach(function() {
                Block1 = BEMDOM.declBlock('block', {
                    onSetMod : {
                        'js' : {
                            'inited' : function() {
                                this.domEvents(document)
                                    .on('click', spy1)
                                    .on('click', spy2);

                                this.domEvents(BEMDOM.doc)
                                    .on('click', data, spy3)
                                    .on({ 'click' : spy4 }, data);
                            }
                        }
                    }
                });
                block1 = BEMDOM.init(BEMHTML.apply({ block : 'block' })).bem(Block1);
            });

            it('should properly bind handlers', function() {
                BEMDOM.doc.trigger('click');

                spy1.should.have.been.called;
                spy2.should.have.been.called;

                spy3.args[0][0].data.should.have.been.equal(data);
                spy4.args[0][0].data.should.have.been.equal(data);
            });

            it('should properly unbind all handlers', function() {
                block1.domEvents(document).un('click');
                BEMDOM.doc.trigger('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
            });

            it('should properly unbind specified handler', function() {
                block1.domEvents($(document)).un('click', spy1);
                BEMDOM.doc.trigger('click');

                spy1.should.not.have.been.called;
                spy2.should.have.been.called;
            });

            it('should properly unbind all handlers on block destruct', function() {
                BEMDOM.destruct(block1.domElem);
                BEMDOM.doc.trigger('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
            });
        });

        describe('window events', function() {
            beforeEach(function() {
                Block1 = BEMDOM.declBlock('block', {
                    onSetMod : {
                        'js' : {
                            'inited' : function() {
                                this.domEvents(window)
                                    .on('resize', spy1)
                                    .on('resize', spy2);

                                this.domEvents($(window))
                                    .on('resize', data, spy3)
                                    .on({ 'resize' : spy4 }, data);
                            }
                        }
                    }
                });
                block1 = createDomNode({ block : 'block' }).bem(Block1);
            });

            it('should properly bind handlers', function() {
                BEMDOM.win.trigger('resize');

                spy1.should.have.been.called;
                spy2.should.have.been.called;

                spy3.args[0][0].data.should.have.been.equal(data);
                spy4.args[0][0].data.should.have.been.equal(data);
            });

            it('should properly unbind all handlers', function() {
                block1.domEvents(window).un('resize');
                BEMDOM.win.trigger('resize');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
            });

            it('should properly unbind specified handler', function() {
                block1.domEvents($(window)).un('resize', spy1);
                BEMDOM.win.trigger('resize');

                spy1.should.not.have.been.called;
                spy2.should.have.been.called;
            });

            it('should properly unbind all handlers on block destruct', function() {
                BEMDOM.destruct(block1.domElem);
                BEMDOM.win.trigger('resize');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
            });
        });
    });

    describe('live events', function() {
        function initDom(bemjson) {
            return createDomNode(bemjson).appendTo(BEMDOM.scope);
        }

        describe('block domElem events', function() {
            beforeEach(function() {
                Block1 = BEMDOM.declBlock('block1', {}, {
                    live : function() {
                        this.domEvents()
                            .on('click', spy1)
                            .on('click', spy2)
                            .on('click', data, wrapSpy(spy3))
                            .on({ 'click' : spy4 }, data);
                    }
                });

                Block2 = BEMDOM.declBlock('block2', {}, {
                    live : function() {
                        this.domEvents()
                            .on('click', spy5);
                    }
                });

                block1 = initDom({
                    block : 'block1',
                    mix : { block : 'block2', js : true }
                }).bem(Block1);
            });

            it('should properly bind handlers', function() {
                block1.domElem.trigger('click');

                spy1.should.have.been.called;
                spy2.should.have.been.called;

                spy3.should.have.been.calledOn(block1);
                spy3.args[0][1].should.be.instanceOf(Block1);
                spy3.args[0][0].data.should.have.been.equal(data);
                spy4.args[0][0].data.should.have.been.equal(data);
            });

            it('should properly unbind all handlers', function() {
                Block1.domEvents().un('click');
                block1.domElem.trigger('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
            });

            it('should properly unbind specified handler', function() {
                Block1.domEvents().un('click', spy1);
                Block1.domEvents().un({ 'click' : spy2 });
                block1.domElem.trigger('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
                spy3.should.have.been.called;
            });

            it('should unbind only own handlers', function() {
                Block1.domEvents().un('click');
                block1.domElem.trigger('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;

                spy5.should.have.been.called;
            });
        });

        describe('block elems events', function() {
            ['string', 'Class'].forEach(function(elemType) {
                var elem1, elem2;

                describe('elem as ' + elemType, function() {
                    var Elem1, Elem2;

                    beforeEach(function() {
                        elem1 = elemType === 'string'?
                            'e1' :
                            BEMDOM.declElem('block', 'e1');

                        Block1 = BEMDOM.declBlock('block', {}, {
                            live : function() {
                                this.domEvents(elem1)
                                    .on('click', spy1)
                                    .on('click', spy2)
                                    .on('click', data, wrapSpy(spy3))
                                    .on({ 'click' : spy4 }, data);

                                this.domEvents('e2').on('click', spy5);
                            }
                        });

                        Elem1 = elemType === 'string'?
                            BEMDOM.declElem('block', 'e1') :
                            elem1;
                        Elem2 = BEMDOM.declElem('block', 'e2', {}, {
                            live : function() {
                                this.domEvents(elem1)
                                    .on('click', wrapSpy(spy6))
                                    .on('click', spy7);
                            }
                        });

                        block1 = initDom({
                            block : 'block',
                            content : [
                                { elem : 'e1', content : { elem : 'e3' } },
                                { elem : 'e2', content : { elem : 'e1' } }
                            ]
                        }).bem(Block1);

                        elem2 = block1.elem('e2');
                    });

                    describe('block', function() {
                        it('should properly bind handlers', function() {
                            block1.elem('e3').domElem.trigger('click');

                            spy1.should.have.been.called;
                            spy1.should.have.been.calledOn(block1);

                            spy2.should.have.been.called;

                            spy3.should.have.been.called;
                            spy3.args[0][0].data.should.have.been.equal(data);
                            spy3.args[0][1].should.be.instanceOf(Elem1);
                            spy3.args[0][1].domElem[0]
                                .should.be.equal(block1.elem(elem1).domElem[0]);

                            spy4.should.have.been.called;
                            spy4.args[0][0].data.should.have.been.equal(data);

                            spy5.should.not.have.been.called;
                        });

                        it('should properly unbind all handlers', function() {
                            Block1.domEvents(elem1).un('click');
                            block1.elem(elem1).domElem.trigger('click');

                            spy1.should.not.have.been.called;
                            spy2.should.not.have.been.called;
                            spy3.should.not.have.been.called;
                        });

                        it('should properly unbind specified handler', function() {
                            Block1.domEvents(elem1).un('click', spy2);
                            block1.elem(elem1).domElem.trigger('click');

                            spy1.should.have.been.called;
                            spy2.should.not.have.been.called;
                            spy3.should.have.been.called;
                        });
                    });

                    describe('elem instance', function() {
                        it('should properly bind handlers', function() {
                            var e2elem1 = elem2.findChildElem('e1');
                            e2elem1.domElem.trigger('click');

                            spy6.should.have.been.called;
                            spy6.should.have.been.calledOn(elem2);
                            spy6.args[0][1].should.be.instanceOf(Elem1);
                            spy6.args[0][1].domElem[0]
                                .should.be.equal(e2elem1.domElem[0]);

                            spy7.should.have.been.called;
                        });

                        it('should properly unbind all handlers', function() {
                            Elem2.domEvents(elem1).un('click');

                            var e2elem1 = elem2.findChildElem('e1');
                            e2elem1.domElem.trigger('click');

                            spy6.should.not.have.been.called;
                            spy7.should.not.have.been.called;
                        });

                        it('should properly unbind specified handler', function() {
                            Elem2.domEvents(elem1).un('click', spy7);

                            var e2elem1 = elem2.findChildElem('e1');
                            e2elem1.domElem.trigger('click');

                            spy6.should.have.been.called;
                            spy7.should.not.have.been.called;
                        });
                    });
                });

                describe('elem as ' + elemType + ', modName, modVal', function() {
                    beforeEach(function() {
                        Block1 = BEMDOM.declBlock('block', {}, {
                            live : function() {
                                this.domEvents({ elem : elem1 })
                                    .on('click', spy1);
                                this.domEvents({ elem : elem1, modName : 'm1', modVal : 'v1' })
                                    .on('click', spy2)
                                    .on('click', spy3);
                            }
                        });

                        block1 = initDom({
                            block : 'block',
                            content : [
                                { elem : 'e1' },
                                { elem : 'e1', elemMods : { m1 : 'v1' } }
                            ]
                        }).bem(Block1);
                    });

                    it('should properly bind handlers', function() {
                        block1.elem({ elem : 'e1', modName : 'm1', modVal : 'v1' }).domElem.trigger('click');

                        spy1.should.have.been.called;
                        spy2.should.have.been.called;

                        block1.elem('e1').domElem.trigger('click');

                        spy1.should.have.been.calledTwice;
                        spy2.should.have.been.calledOnce;
                    });

                    it('should properly unbind all handlers', function() {
                        Block1.domEvents({ elem : elem1, modName : 'm1', modVal : 'v1' }).un('click');

                        block1.elem({ elem : 'e1', modName : 'm1', modVal : 'v1' }).domElem.trigger('click');

                        spy1.should.have.been.called;
                        spy2.should.not.have.been.called;
                    });

                    it('should properly unbind specified handler', function() {
                        Block1.domEvents({ elem : elem1, modName : 'm1', modVal : 'v1' }).un('click', spy2);

                        block1.elem({ elem : 'e1', modName : 'm1', modVal : 'v1' }).domElem.trigger('click');

                        spy1.should.have.been.called;
                        spy2.should.not.have.been.called;
                        spy3.should.have.been.called;
                    });
                });
            });
        });
    });
});

provide();

function createDomNode(bemjson) {
    return BEMDOM.init(BEMHTML.apply(bemjson));
}

});
