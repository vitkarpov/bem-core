/**
 * @module i-bem-dom__event-manager_type_dom
 */
modules.define(
    'i-bem-dom__event-manager_type_dom',
    [
        'inherit',
        'identify',
        'objects',
        'jquery'
    ],
    function(
        provide,
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
                    var wrappedFn;
                    if(this._params.entityCls) {
                        var fnId = identify(fn);
                        wrappedFn = this._storage[e] && this._storage[e][fnId];
                        wrappedFn && (this._storage[e][fnId] = null);
                    }
                    this._params.ctx.off(e, this._params.selector, wrappedFn || fn);
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
    createInstanceEventManager : function(instance, params) {
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

    createClassEventManager : function(cls, params) {
        var clsId = identify(cls),
            clsStorage = eventStorage[clsId] || (eventStorage[clsId] = {}),
            entitySelector = cls.buildSelector();

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

