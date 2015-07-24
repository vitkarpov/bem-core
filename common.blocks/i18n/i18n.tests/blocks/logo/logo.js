modules.define('logo', ['i-bem-dom', 'i18n'], function(provide, bemDom, i18n) {

provide(bemDom.declBlock(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
                this._domEvents().on('click', function() {
                    this.domElem.text(i18n('logo', 'yandex-service', this.params.service));
                });
            }
        }
    }
}));

});
