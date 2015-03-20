/* borschik:include:index.js */

modules.define('i18n', function(provide) {

provide((/* borschik:include:../../common.blocks/i18n/i18n.i18n.js */)().decl({
    "b-square" : {
        "js" : "ДжаваСкрипт",
        "js2" : function(x) {
            return 'asdf' + x;
        }
    },
    "b-circle" : {
        "css" : "Каскадные таблицы стилей"
    }
}));

});

modules.define('BEMHTML', ['i18n'], function(provide, i18n, BEMHTML) {

BEMHTML.BEMContext.prototype.i18n = i18n;
provide(BEMHTML);

});

