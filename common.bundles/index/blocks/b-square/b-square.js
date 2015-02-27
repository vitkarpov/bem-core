/**
 * The block's BEM declaration can state which block (a block with a modifier or a block
 * with a specific modifier value)
 * a given JavaScript component refers to.
 *
 * You can find various declarations on the i-bem block's wiki page, blocks/i-bem/i-bem.wiki
 */
modules.define('b-square', ['i-bem-dom', 'BEMHTML', 'i18n'], function(provide, iBemDom, BEMHTML, i18n) {

provide(iBemDom.declBlock('b-square', {
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.toggleMod('color', '', 'green');
                iBemDom.update(this.domElem, BEMHTML.apply({ block: 'b-square', content: i18n('b-square', 'js') }));
            }
        }
    }
}, {}));

});
