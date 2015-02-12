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
        'functions',
        'jquery'
    ],
    function(
        provide,
        BEMINTERNAL,
        inherit,
        identify,
        objects,
        functions,
        $) {

var InstanceEventManager = inherit({
    }),
    ClassEventManager = inherit({
    });

provide({
    InstanceEventManager : InstanceEventManager,
    ClassEventManager : ClassEventManager
});

});

