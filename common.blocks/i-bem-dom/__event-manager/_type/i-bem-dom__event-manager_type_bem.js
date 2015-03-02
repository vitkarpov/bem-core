/**
 * @module i-bem-dom__event-manager_type_bem
 */
modules.define(
    'i-bem-dom__event-manager_type_bem',
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
    EVENT_PREFIX = '__bem__',

    eventStorage = {},

    buildEventName = function(e, entityName) {
        return EVENT_PREFIX + entityName + (typeof e === 'object'? e.type : e);
    },

    buildBemEventManagerParams = function(ctx, defCtx, defSelector, defCls, getEntityCls) {
        var res = {
                entityCls : null,
                ctx : defCtx,
                selector : defSelector,
                key : ''
            };

        if(ctx) {
            var typeOfCtx = typeof ctx;

            if(typeOfCtx === 'string' || typeOfCtx === 'object' || typeOfCtx === 'function') {
                var entityName, blockName, elemName, modName, modVal;
                if(typeOfCtx === 'string') { // elem name
                    blockName = defCls._blockName;
                    elemName = ctx;
                } else if(typeOfCtx === 'object') { // bem entity with optional mod val
                    blockName = ctx.block?
                        ctx.block.getName() :
                        defCls._blockName;
                    elemName = typeof ctx.elem === 'function'?
                        ctx.elem.getName() :
                        ctx.elem;
                    modName = ctx.modName;
                    modVal = ctx.modVal;
                } else if(ctx.getName() === ctx.getEntityName()) { // block class
                    blockName = ctx.getName();
                } else { // elem class
                    blockName = defCls._blockName;
                    elemName = ctx.getName();
                }

                entityName = BEMINTERNAL.buildClass(blockName, elemName);
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
                var params = this._params;

                e = buildEventName(e, params.entityCls.getEntityName());

                if(arguments.length === 2) {
                    fn = data;
                    data = undef;
                }

                var fnStorage = this._storage[e] || (this._storage[e] = {}),
                    fnId = identify(fn);
                params.ctx.on(
                    e,
                    params.selector,
                    data,
                    fnStorage[fnId] = this._fnWrapper(fn, fnId));
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
                } else {
                    var params = this._params;

                    e = buildEventName(e, params.entityCls.getEntityName());

                    if(argsLen === 1) {
                        this._unbindByEvent(this._storage[e], e);
                    } else {
                        var wrappedFn;
                        if(params.entityCls) {
                            var fnId = identify(fn),
                                fnStorage = this._storage[e];
                            wrappedFn = fnStorage && fnStorage[fnId];
                            wrappedFn && (fnStorage[fnId] = null);
                        }
                        params.ctx.off(e, params.selector, wrappedFn || fn);
                    }
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
                delete eventStorage[instanceId];
            });
        }

        var params = buildBemEventManagerParams(
                ctx,
                instance.domElem,
                '',
                instance.__self,
                getEntityCls);

        return instanceStorage[params.key] ||
            (instanceStorage[params.key] = new EventManager(
                params,
                function(fn, fnId) {
                    return function(e, data, flags, originalEvent) {
                        if(!flags[fnId]) {
                            originalEvent.data = e.data;
                            originalEvent.bemTarget = $(e.currentTarget).bem(params.entityCls);
                            flags[fnId] = true;
                            fn.call(instance, originalEvent);
                        }
                    };
                }));
    },

    getClassEventManager : function(cls, ctx, scope, getEntityCls) {
        var clsId = identify(cls),
            clsStorage = eventStorage[clsId] || (eventStorage[clsId] = {}),
            entitySelector = cls.buildSelector(),
            params = buildBemEventManagerParams(
                ctx,
                scope,
                cls.buildSelector(),
                cls,
                getEntityCls);

        return clsStorage[params.key] ||
            (clsStorage[params.key] = new EventManager(
                params,
                function(fn, fnId) {
                    return function(e, data, flags, originalEvent) {
                        if(!flags[fnId]) {
                            var entityDomNode = $(e.target).closest(entitySelector);
                            if(entityDomNode[0]) {
                                originalEvent.bemTarget = $(this).bem(params.entityCls);
                                originalEvent.data = e.data;
                                flags[fnId] = true;
                                fn.call(entityDomNode.bem(cls), originalEvent);
                            }
                        }
                    };
                }));
    },

    buildEventName : buildEventName
});

});
