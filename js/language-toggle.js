function toggleEnglish() {    
    sm.getApi({version: 'v1'}).then(function(api){api.setLocale('en-US')});
    sm.logger.log("English app loaded");
}

function toggleSpanish() {
    sm.getApi({version: 'v1'}).then(function(api){api.setLocale('es-MX')});
    sm.logger.log("Spanish app loaded");
}