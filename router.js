const routes = {
"/check-visa": "/check-my-visa.html",
"/apply": "/apply-visa.html",
"/visa-requirements": "/do-i-need-a-visa.html",
"/application-status": "/check-your-application-status.html",
"/continue-application": "/continue-application.html"
};

const path = window.location.pathname;

if(routes[path]){
window.location.replace(routes[path]);
}
