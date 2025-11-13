var invoke_make_blank = true;

$("#loginForm").submit(function(e) {
  e.preventDefault();
});

function pageType() {
  localStorage.setItem('isPortal', document.getElementsByClassName("portal").length);
}

function validate() {
  const username = document.getElementById("first_name").value;

  localStorage.setItem('loggingStatus', true);
  localStorage.setItem('username', username || "Julie");

//Set custom attributes
  sm.getApi({version: 'v1'}).then(function(glia) {
    glia.updateInformation({
      customAttributesUpdateMethod: 'replace',
      name:'Julie Anderson',
      email:'janderson@waltersIns.com',
      phone:'+12128854432',
      externalId: '23885-JA',
      customAttributes: {
        NIPR:'732-334-223',

      }
    }).catch(function(error){
    console.log(JSON.stringify(error));
  }).then(function(){
    console.log('Custom attributes set');
    window.location = "portal-agentprofile.html";  
  })});
  

  return true;
}

function loggingToggle() {
  const loggedStatus = localStorage.getItem('loggingStatus');
  
  if (loggedStatus) {
    document.getElementsByClassName("login-section")[0].innerHTML = "<div class='control-label'>Welcome, Julie</div><a href='javascript:logOut()' id='log-out'><span class='tooltiptext'>Log Out</span><img id='logout-icon' src='images/logout.png'</a>";
  }
}

function logOut() {
  
  localStorage.removeItem('loggingStatus', 'username');

  //remove attributes
  sm.getApi({version: 'v1'}).then(function(glia) {
    glia.updateInformation({
      customAttributesUpdateMethod: 'replace',
      name:'',
      email:'',
      phone:'',
      externalId: '',
      customAttributes: {
  

      }
    }).catch(function(error){
    console.log(JSON.stringify(error));
  }).then(function(){
    console.log('Custom attributes set');
    window.location = "login-portal.html";  
  })});

  
}
