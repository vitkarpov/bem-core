/**
 * @module i-bem-dom__event-manager_type_dom
 */
modules.define(
    'i-bem-dom__event-manager_type_dom',
    [
        'i-bem__internal',
        'inherit',
        'identify',
        'objects',
        'jquery'
    ],
    function(
        provide,
        BEMINTERNAL,
        inherit,
        identify,
        objects,
        $) {

var undef,
    winNode = window,
    docNode = document,
    winId = identify(winNode),
    docId = identify(docNode),

    eventStorage = {},

    buildDomEventManagerParams = function(ctx, defCtx, defSelector, defCls, getEntityCls) {
        var res = {
                entityCls : null,
                ctx : defCtx,
                selector : defSelector,
                key : ''
            };

        if(ctx) {
            var typeOfCtx = typeof ctx;

            if(ctx.jquery && ctx.length === 1) {
                if(ctx[0] !== winNode && ctx[0] !== docNode)
                    throw Error('DOM-events: jQuery-chain can contain only document or window');
                res.ctx = ctx;
                res.key = identify(ctx);
            } else if(ctx === winNode || ctx === docNode) {
                res.ctx = $(ctx);
                res.key = identify(ctx);
            } else if(typeOfCtx === 'string' || typeOfCtx === 'object' || typeOfCtx === 'function') {
                var elemName, modName, modVal;
                if(typeOfCtx === 'string') { // elem name
                    elemName = ctx;
                } else if(typeOfCtx === 'object') { // bem entity with optional mod val
                    elemName = typeof ctx.elem === 'function'?
                        ctx.elem.getName() :
                        ctx.elem;
                    modName = ctx.modName;
                    modVal = ctx.modVal;
                } else { // elem class
                    elemName = ctx.getName();
                }

                var entityName = BEMINTERNAL.buildClass(defCls._blockName, elemName);
                res.entityCls = getEntityCls(entityName);
                res.selector = '.' + (res.key = entityName + BEMINTERNAL.buildModPostfix(modName, modVal));
            }
        } else {
            res.entityCls = defCls;
        }

        return res;
    },

    EventManager = inherit({
        __constructor : function(params, fnWrapper) {
            this._params = params;
            this._fnWrapper = fnWrapper;
            this._storage = {};
        },

        /**
         * Adds an event handler
         * @param {String} e Event type
         * @param {Object} [data] Additional data that the handler gets as e.data
         * @param {Function} fn Handler
         * @returns {EventManager} this
         */
        on : function(e, data, fn) {
            if(typeof e === 'object') {
                objects.each(e, function(fn, e) {
                    this.on(e, data, fn);
                }, this);
            } else {
                if(arguments.length === 2) {
                    fn = data;
                    data = undef;
                }

                var fnStorage = this._storage[e] || (this._storage[e] = {}),
                    params = this._params;

                params.ctx.on(
                    e,
                    params.selector,
                    data,
                    fnStorage[identify(fn)] = params.entityCls?
                        this._fnWrapper(fn) :
                        fn);
            }

            return this;
        },

        /**
         * Removes event handler or handlers
         * @param {String} [e] Event type
         * @param {Function} [fn] Handler
         * @returns {EventManager} this
         */
        un : function(e, fn) {
            if(typeof e === 'object') {
                objects.each(e, function(fn, e) {
                    this.un(e, fn);
                }, this);
            } else {
                var argsLen = arguments.length;
                if(!argsLen) {
                    objects.each(this._storage, this._unbindByEvent, this);
                } else if(argsLen === 1) {
                    this._unbindByEvent(this._storage[e], e);
                } else {
                    var wrappedFn,
                        params = this._params;
                    if(params.entityCls) {
                        var fnId = identify(fn),
                            fnStorage = this._storage[e];
                        wrappedFn = fnStorage && fnStorage[fnId];
                        wrappedFn && (fnStorage[fnId] = null);
                    }
                    params.ctx.off(e, params.selector, wrappedFn || fn);
                }
            }

            return this;
        },

        _unbindByEvent : function(fnStorage, e) {
            var params = this._params;
            fnStorage && objects.each(fnStorage, function(fn) {
                params.ctx.off(e, params.selector, fn);
            });
            this._storage[e] = null;
        }
    });

provide({
    getInstanceEventManager : function(instance, ctx, getEntityCls) {
        var instanceId = identify(instance),
            instanceStorage = eventStorage[instanceId];

        if(!instanceStorage) {
            instanceStorage = eventStorage[instanceId] = {};
            instance.on({ modName : 'js', modVal : '' }, function() {
                instanceStorage[docId] && instanceStorage[docId].un();
                instanceStorage[winId] && instanceStorage[winId].un();
                delete eventStorage[instanceId];
            });
        }

        var params = buildDomEventManagerParams(
                ctx,
                instance.domElem,
                '',
                instance.__self,
                getEntityCls);

        return instanceStorage[params.key] ||
            (instanceStorage[params.key] = new EventManager(
                params,
                function(fn) {
                    return function(e) {
                        e.bemTarget = $(e.currentTarget).bem(params.entityCls);
                        fn.call(instance, e);
                    };
                }));
    },

    getClassEventManager : function(cls, ctx, scope, getEntityCls) {
        var clsId = identify(cls),
            clsStorage = eventStorage[clsId] || (eventStorage[clsId] = {}),
            entitySelector = cls.buildSelector(),
            params = buildDomEventManagerParams(
                ctx,
                scope,
                cls.buildSelector(),
                cls,
                getEntityCls);

        return clsStorage[params.key] ||
            (clsStorage[params.key] = new EventManager(
                params,
                function(fn) {
                    return function(e) {
                        // TODO: we could optimize all these "closest" to a single traversing
                        var entityDomNode = $(e.target).closest(entitySelector);
                        if(entityDomNode[0]) {
                            e.bemTarget = $(this).bem(params.entityCls);
                            fn.call(entityDomNode.bem(cls), e);
                        }
                    };
                }));
    }
});

});
