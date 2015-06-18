module.exports = function(config) {

config.node('common.bundles/i18n', function(nodeConfig) {
    config.setLanguages(['ru', 'en']);

    nodeConfig.addTechs([
        [require('enb-bem-techs/techs/levels'), { levels : getLevels() }],
        [require('enb/techs/file-provider'), { target : '?.bemjson.js' }],
        require('enb-bem-techs/techs/bemjson-to-bemdecl'),
        require('enb-bem-techs/techs/deps'),
        require('enb-bem-techs/techs/files'),

        [require('enb/techs/js'), { target : '?.pre.js', sourceSuffixes  : ['vanilla.js', 'js', 'browser.js'] }],
        [require('enb-bem-i18n/techs/i18n-js'), { target : '?.i18n.{lang}.js', lang : '{lang}' }]
    ]);
    nodeConfig.addTechs(config.getLanguages().map(function(lang) {
        return [require('enb/techs/file-merge'), {
            sources : ['?.pre.js', '?.i18n.' + lang + '.js'],
            target : '?.pre.' + lang + '.js' }];
    }));
    nodeConfig.addTechs([
        [require('enb-modules/techs/prepend-modules'), { source : '?.pre.{lang}.js', target : '?.{lang}.js' }],

        [require('enb-bem-i18n/techs/keysets'), { lang : '{lang}' }],

        [require('enb-bem-i18n/techs/bemhtml-i18n'), { lang : '{lang}', devMode : true }],
        [require('./techs/i18n-bemjson-to-html'), { templateFile : '?.bemhtml.{lang}.js', lang : '{lang}' }]
    ]);

    nodeConfig.addTargets([
        '?.{lang}.js',
        '?.{lang}.html'
    ]);

    function getLevels() {
        return [
            { path : 'common.blocks', check : true }
        ].map(function(l) { return config.resolvePath(l); });
    }
});

};
