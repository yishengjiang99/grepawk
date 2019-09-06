var fs = function(){ //chrome fs
    const sources=[
        'chrome',           'Browser',          [],
        'local_hd',         'My Computer',      ["C:","D:","/User"],
        'cloud storage',    'Remote Disk',      ['Drop Box', 'Google Docs', 'MS Azure'],
        'social_media',     'My Social Meida',  ['Facebook', 'Instagram', 'PayPal', 'Bank of America', 'LinkedIn'],
        'email',            'IMAP',             ['gmail']
    ]
    return{
        get_fs_sources: function(root){

            var souceObjects ={};
            var i;
            for(i=0; i<sources.length; i++){
                if(i % 3 === 0) souceObjects[sources[i]]={};
                if(i % 3 === 1) souceObjects[sources[i-1]] = sources[i];
                if(i % 3 === 2) souceObjects[sources[i-2]] =  sources[i];
            }

            console.log(souceObjects);
        }


    }

}

