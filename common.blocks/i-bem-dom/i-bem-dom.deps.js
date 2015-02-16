[{
    shouldDeps : [
        'inherit',
        'jquery',
        'objects',
        'functions',
        'dom',
        { mod : 'init' },
        { block : 'i-bem', elems : ['internal'] },
        { elem : 'event-manager', mods : { type : 'dom' } }
    ]
},
{
    tech : 'spec.js',
    mustDeps : [
        {
            block : 'i-bem',
            tech : 'bemhtml'
        }
    ]
}]
