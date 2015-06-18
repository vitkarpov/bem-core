modules.define('logo', ['i-bem-dom', 'i18n'], function(provide, bemDom, i18n) {

provide(bemDom.declBlock(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.bindTo('click', function() {
                    this.domElem.text(i18n('logo', 'yandex-service', this.params.service));
                });
            }
        }
    }
}))

});
