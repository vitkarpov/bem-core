modules.define(
    'spec',
    ['i-bem', 'i-bem-dom', 'objects', 'events', 'jquery', 'chai', 'sinon', 'BEMHTML'],
    function(provide, BEM, BEMDOM, objects, events, $, chai, sinon, BEMHTML) {

var undef,
    expect = chai.expect;

describe('BEM events', function() {
    var Block1, Block2, block1, spy1, spy2, spy3, spy4, spy5, spy6, spy7, spy8,
        wrapSpy = function(spy) {
            return function(e) {
                // NOTE: we need to pass bemTarget explicitly, as `e` is being
                // changed while event is propagating
                spy.call(this, e, e.bemTarget, e.data);
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
        spy8 = sinon.spy();
    });

    afterEach(function() {
        BEMDOM.destruct(BEMDOM.scope, true);

        objects.each(BEM.entities, function(_, entityName) {
            delete BEM.entities[entityName];
        });
    });

    function initDom(bemjson) {
        return createDomNode(bemjson).appendTo(BEMDOM.scope);
    }

    describe('on instance events', function() {
        describe('block BEM events', function() {
            beforeEach(function() {
                Block1 = BEMDOM.declBlock('block1', {
                    onSetMod : {
                        'js' : {
                            'inited' : function() {
                                this.events()
                                    .on('click', spy1)
                                    .on('click', spy2)
                                    .on('click', data, wrapSpy(spy3))
                                    .on({ 'click' : spy4 }, data);
                            }
                        }
                    }
                });

                Block2 = BEMDOM.declBlock('block2', {
                    onSetMod : {
                        'js' : {
                            'inited' : function() {
                                this.events()
                                    .on('click', spy5);
                            }
                        }
                    }
                });

                block1 = initDom({
                    block : 'block1',
                    mix : { block : 'block2', js : true }
                }).bem(Block1);
            });

            it('should properly bind handlers', function() {
                block1.emit('click');

                spy1.should.have.been.called;
                spy2.should.have.been.called;

                spy3.should.have.been.calledOn(block1);
                var spy3EventParam = spy3.args[0][0];
                spy3EventParam.should.be.instanceOf(events.Event);
                spy3EventParam.bemTarget.should.be.instanceOf(Block1);
                spy3EventParam.bemTarget.should.be.equal(block1);
                spy3EventParam.data.should.have.been.equal(data);

                spy4.args[0][0].data.should.have.been.equal(data);
            });

            it('should not handle homonymous dom event', function() {
                block1.domElem.trigger('click');
                spy1.should.not.have.been.called;
            });

            it('should not handle homonymous bem event', function() {
                block1.domEvents().on('click', spy6);
                block1.emit('click');
                spy6.should.not.have.been.called;
            });

            it('should properly unbind all handlers', function() {
                block1.events().un('click');
                block1.emit('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
            });

            it('should properly unbind specified handler', function() {
                block1.events().un('click', spy1);
                block1.events().un({ 'click' : spy2 });
                block1.emit('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
                spy3.should.have.been.called;
            });

            it('should unbind only own handlers', function() {
                block1.events().un('click');
                block1.emit('click');
                block1.findMixedBlock(Block2).emit('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;

                spy5.should.have.been.called;
            });

            it('should properly emit event as instance (not string)', function() {
                var e = new events.Event('click');
                block1.emit(e);
                spy1.args[0][0].should.be.equal(e);
            });
        });

        describe('block instance events', function() {
            var block2_1, block2_2;
            beforeEach(function() {
                Block1 = BEMDOM.declBlock('block1', {
                    onSetMod : {
                        'js' : {
                            'inited' : function() {
                                this.events(block2_1 = this.findChildBlocks(Block2)[0])
                                    .on('click', spy1)
                                    .on('click', spy2)
                                    .on('click', data, wrapSpy(spy3))
                                    .on({ 'click' : wrapSpy(spy4) }, data);

                                this.events(block2_2 = this.findChildBlocks(Block2)[1])
                                    .on('click', spy5);
                            }
                        }
                    }
                });

                Block2 = BEMDOM.declBlock('block2');

                block1 = initDom({
                    block : 'block1',
                    content : [
                        { block : 'block2' },
                        { block : 'block2' }
                    ]
                }).bem(Block1);
            });

            it('should properly bind handlers', function() {
                block2_1.emit('click');

                spy1.should.have.been.called;
                spy2.should.have.been.called;

                spy3.should.have.been.calledOn(block1);
                spy3.args[0][0].should.be.instanceOf(events.Event);
                spy3.args[0][1].should.be.equal(block2_1);
                spy3.args[0][2].should.have.been.equal(data);

                spy4.args[0][2].should.have.been.equal(data);

                spy5.should.not.have.been.called;
            });

            it('should properly unbind all handlers', function() {
                block1.events(block2_1).un('click');
                block2_1.emit('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;

                block2_2.emit('click');

                spy5.should.have.been.called;
            });

            it('should properly unbind specified handler', function() {
                block1.events(block2_1).un('click', spy1);
                block1.events(block2_1).un({ 'click' : spy2 });
                block1.emit('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
                spy3.should.have.been.called;
            });
        });

        describe('nested blocks events', function() {
            beforeEach(function() {
                Block1 = BEMDOM.declBlock('block', {
                    onSetMod : {
                        'js' : {
                            'inited' : function() {
                                this.events(Block2).on('click', wrapSpy(spy1));
                            }
                        }
                    }
                });

                Block2 = BEMDOM.declBlock('block2');

                block1 = initDom({
                    block : 'block',
                    content : [
                        {
                            block : 'block2',
                            content : { block : 'block2' }
                        }
                    ]
                }).bem(Block1);
            });

            it('should properly handle events (bound in class context) from nested block', function() {
                var block2 = block1.findChildBlocks(Block2)[1];
                block2.emit('click');

                spy1.should.have.been.calledOnce;
                spy1.args[0][1].should.be.equal(block2);
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
                        this.events()
                            .on('click', spy1)
                            .on('click', spy2)
                            .on('click', data, wrapSpy(spy3))
                            .on({ 'click' : spy4 }, data);
                    }
                });

                Block2 = BEMDOM.declBlock('block2', {}, {
                    live : function() {
                        this.events()
                            .on('click', spy5);
                    }
                });

                block1 = initDom({
                    block : 'block1',
                    mix : { block : 'block2', js : true }
                }).bem(Block1);
            });

            it('should properly bind handlers', function() {
                block1.emit('click');

                spy1.should.have.been.called;
                spy2.should.have.been.called;

                spy3.should.have.been.calledOn(block1);
                spy3.args[0][1].should.be.instanceOf(Block1);
                spy3.args[0][0].data.should.have.been.equal(data);
                spy4.args[0][0].data.should.have.been.equal(data);

                spy5.should.not.have.been.called;
            });

            it('should properly unbind all handlers', function() {
                Block1.events().un('click');
                block1.emit('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
            });

            it('should properly unbind specified handler', function() {
                Block1.events().un('click', spy1);
                Block1.events().un({ 'click' : spy2 });
                block1.emit('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;
                spy3.should.have.been.called;
            });

            it('should unbind only own handlers', function() {
                Block1.events().un('click');
                block1.emit('click');

                spy1.should.not.have.been.called;
                spy2.should.not.have.been.called;

                block1
                    .findMixedBlock(Block2)
                    .emit('click');

                spy5.should.have.been.called;
            });
        });
    });
});

provide();

function createDomNode(bemjson) {
    return BEMDOM.init(BEMHTML.apply(bemjson));
}

});
