BEMDOM.declElem({ block : Input, elem : 'control' }, {



}, {
    live : function() {
        this.domEvents().on('change', function() {
            this.block.emit('change');
        });
    }
});