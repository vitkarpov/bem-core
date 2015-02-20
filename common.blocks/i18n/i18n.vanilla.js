/**
 * @module i18n
 */
(function() {

var data;

/**
 * @exports
 * @param {String} keyset
 * @param {String} key
 * @param {Object} [params]
 * @returns {String}
 */
function i18n(keyset, key, params) {
    if(!data) throw Error('i18n need to be filled with data');
    var val = data[keyset] && data[keyset][key];
    return typeof val === 'undefined'?
    keyset + ':' + key :
        typeof val === 'string'?
            val :
            val.call(i18n, params, i18n);
}

i18n.decl = function(i18nData) {
    if(!data) {
        data = i18nData;
        return this;
    }

    for(var ks in i18nData) {
        var dataKs = data[ks] || (data[ks] = {}),
            i18nDataKs = i18nData[ks];

        for(var k in i18nDataKs)
            dataKs[k] = i18nDataKs[k];
    }

    return this;
};

if(typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = i18n;
}

if(typeof modules === 'object' && typeof modules.define === 'function') {
    modules.define('i18n', function(provide) {
        provide(i18n);
    });
}

})();
