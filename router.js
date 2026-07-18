(function(){

const routes = {

"check-visa":
"check-my-visa.html",

"apply":
"apply-visa.html",

"visa-requirements":
"do-i-need-a-visa.html",

"application-status":
"check-your-application-status.html",

"continue-application":
"continue-application.html"

};

const pathParts =
window.location.pathname
.split("/")
.filter(Boolean);

const lastPart =
pathParts[
pathParts.length - 1
] || "";

if(!routes[lastPart]){
return;
}

const baseParts =
pathParts.slice(0,-1);

const target =
"/" +
(
baseParts.length
? baseParts.join("/") + "/"
: ""
) +
routes[lastPart];

window.location.replace(target);

})();
