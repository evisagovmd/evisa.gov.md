(function(){

"use strict";

const config = window.EVISA_CONFIG || {};


/* =========================================================
   TEXT NORMALIZATION
========================================================= */

function normalize(value){

return String(value || "")
.trim()
.toUpperCase()
.replace(/\s+/g, "");

}


/* =========================================================
   SAFE HTML OUTPUT
========================================================= */

function safe(value){

const text =
value === undefined ||
value === null ||
value === ""
? "—"
: String(value);

return text.replace(/[&<>"']/g, function(character){

const characters = {
"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"
};

return characters[character];

});

}


/* =========================================================
   STATUS COLOR CLASS
========================================================= */

function statusClass(status){

const text =
String(status || "")
.toLowerCase();

if(text.includes("approved")){
return "status-approved";
}

if(text.includes("invalid")){
return "status-invalid";
}

if(text.includes("expired")){
return "status-invalid";
}

if(text.includes("valid")){
return "status-valid";
}

if(text.includes("pending")){
return "status-pending";
}

if(text.includes("reject")){
return "status-rejected";
}

if(text.includes("cancel")){
return "status-cancelled";
}

return "";

}


/* =========================================================
   LOAD JSON DATABASE

   Supports both:

   New format:
   [
     {...}
   ]

   Old format:
   {
     "records":[
       {...}
     ]
   }
========================================================= */

async function loadJson(file){

const response = await fetch(
file + "?v=" + Date.now(),
{
cache:"no-store"
}
);

if(!response.ok){

throw new Error(
"Unable to load " + file
);

}

const data =
await response.json();


/* New direct-array format */

if(Array.isArray(data)){

return data;

}


/* Old records-wrapper format */

if(
data &&
Array.isArray(data.records)
){

return data.records;

}


/* Optional alternative wrapper support */

if(
data &&
Array.isArray(data.applications)
){

return data.applications;

}

if(
data &&
Array.isArray(data.visas)
){

return data.visas;

}


throw new Error(
file +
" must contain an array, records array, visas array or applications array."
);

}


/* =========================================================
   DISPLAY MESSAGE
========================================================= */

function showMessage(
container,
type,
message
){

if(!container){
return;
}

container.innerHTML =
'<div class="' +
type +
'">' +
safe(message) +
'</div>';

}


/* =========================================================
   IMAGE CANDIDATE GENERATOR
========================================================= */

function createImageCandidates(
folder,
preferredName,
fallbackName
){

const extensions =
config.imageExtensions ||
[
"jpg",
"jpeg",
"png",
"webp"
];

const candidates = [];


function addName(name){

if(!name){
return;
}

const cleanName =
String(name)
.trim()
.replace(/^\/+/,"");

if(!cleanName){
return;
}

const hasExtension =
/\.[a-z0-9]+$/i.test(cleanName);


/*
If complete path is already supplied
*/

if(cleanName.includes("/")){

candidates.push(cleanName);

}else{

/*
New organized folder
*/

candidates.push(
folder + cleanName
);


/*
Old root-folder fallback
*/

candidates.push(cleanName);

}


/*
Try supported extensions automatically
*/

if(!hasExtension){

extensions.forEach(function(extension){

candidates.push(
folder +
cleanName +
"." +
extension
);

candidates.push(
cleanName +
"." +
extension
);

});

}

}


addName(preferredName);


if(
fallbackName &&
normalize(fallbackName) !==
normalize(preferredName)
){

addName(fallbackName);

}


/*
Remove duplicate paths
*/

return [...new Set(candidates)];

}


/* =========================================================
   MOUNT IMAGE WITH FALLBACK
========================================================= */

function mountImage(
containerId,
candidates,
altText
){

const container =
document.getElementById(containerId);

if(!container){
return;
}

if(!candidates.length){

container.innerHTML =
'<div class="image-placeholder">' +
'Image not available' +
'</div>';

return;

}

const image =
document.createElement("img");

image.alt =
altText || "Verification image";

image.loading = "eager";

let index = 0;


function tryNext(){

if(index >= candidates.length){

container.innerHTML =
'<div class="image-placeholder">' +
'Image not found.<br>' +
'Please verify the filename and folder.' +
'</div>';

return;

}

image.src =
candidates[index];

index++;

}


image.onerror = tryNext;

container.innerHTML = "";

container.appendChild(image);

tryNext();

}


/* =========================================================
   BUILD DETAILS TABLE ROWS
========================================================= */

function detailRows(rows){

return rows.map(function(row){

const label =
row[0];

const value =
row[1];

const className =
row[2] || "";

return `
<tr>
<th>${safe(label)}</th>
<td class="${className}">
${safe(value)}
</td>
</tr>
`;

}).join("");

}


/* =========================================================
   VISA RESULT
========================================================= */

function buildVisaResult(record){

const fullName =
record.full_name ||
[
record.firstname,
record.surname
]
.filter(Boolean)
.join(" ");


const status =
record.status || "—";


/*
Sticker filename priority:

1. sticker
2. sticker_file
3. visa_number
*/

const stickerName =
record.sticker ||
record.sticker_file ||
record.visa_number;


/*
Old and new field compatibility
*/

const nationality =
record.nationality ||
record.citizenship;


const visaCategory =
record.visatype ||
record.visa_category ||
record.visa_type;


const issuePlace =
record.issue_place ||
record.issued_from ||
record.issueplace;


const issueDate =
record.issue_date ||
record.issued_date ||
record.issueDate;


/*
Important old-file compatibility:

Old field:
validity

New field:
expiry_date
*/

const expiryDate =
record.expiry_date ||
record.validity ||
record.expiry ||
record.valid_until;


const html = `

<section class="result-card">

<div class="result-header">

<h2>
Visa Verification Result
</h2>

<span class="verification-badge">
Record located
</span>

</div>

<div class="result-content">

<div
id="visa-sticker-panel"
class="media-panel sticker-panel">
</div>

<table
class="details-table"
aria-label="Visa details">

<tbody>

${detailRows([

[
"Visa Status",
status,
statusClass(status)
],

[
"Full Name",
fullName
],

[
"Date of Birth",
record.dob ||
record.date_of_birth
],

[
"Nationality",
nationality
],

[
"Passport Number",
record.passport ||
record.passport_number
],

[
"Visa Number",
record.visa_number ||
record.visanumber
],

[
"Visa Category",
visaCategory
],

[
"Issued From",
issuePlace
],

[
"Issue Date",
issueDate
],

[
"Expiry Date",
expiryDate
]

])}

</tbody>

</table>

</div>

<div class="result-actions">

<button
type="button"
class="search-again"
data-reset="visa">

Another Search

</button>

</div>

</section>

`;


const candidates =
createImageCandidates(

config.stickerFolder ||
"assets/visa-stickers/",

stickerName,

record.visa_number

);


return {

html:html,

candidates:candidates,

fullName:fullName

};

}


/* =========================================================
   APPLICATION / INVITATION RESULT
========================================================= */

function buildApplicationResult(record){

const fullName =
record.full_name ||
[
record.firstname,
record.surname
]
.filter(Boolean)
.join(" ");


const status =
record.status ||
record.invitation_status ||
"—";


const preferredPhoto =
record.photo ||
record.photo_file ||
record.applicant_photo;


const fallbackPhoto =
record.passport ||
record.passport_number;


const nationality =
record.nationality ||
record.citizenship;


const invitationNumber =
record.invitation_number ||
record.application_number;


const invitationType =
record.invitation_type ||
record.application_type;


const issueDate =
record.issue_date ||
record.invitation_issue_date;


const expiryDate =
record.expiry_date ||
record.validity ||
record.invitation_expiry_date;


const html = `

<section class="result-card">

<div class="result-header">

<h2>
Invitation Verification Result
</h2>

<span class="verification-badge">
Record located
</span>

</div>

<div class="result-content">

<div
id="application-photo-panel"
class="media-panel photo-panel">
</div>

<table
class="details-table"
aria-label="Invitation details">

<tbody>

${detailRows([

[
"Invitation Status",
status,
statusClass(status)
],

[
"Full Name",
fullName
],

[
"Nationality",
nationality
],

[
"Passport Number",
record.passport ||
record.passport_number
],

[
"Invitation Number",
invitationNumber
],

[
"Invitation Type",
invitationType
],

[
"Invitation Issue Date",
issueDate
],

[
"Invitation Expiry Date",
expiryDate
]

])}

</tbody>

</table>

</div>

<div class="result-actions">

<button
type="button"
class="search-again"
data-reset="application">

Another Search

</button>

</div>

</section>

`;


const candidates =
createImageCandidates(

config.applicantPhotoFolder ||
"assets/applicant-photos/",

preferredPhoto,

fallbackPhoto

);


return {

html:html,

candidates:candidates,

fullName:fullName

};

}


/* =========================================================
   VISA SEARCH
========================================================= */

async function handleVisaSearch(event){

event.preventDefault();


const result =
document.getElementById(
"visa-result"
);


const button =
event.currentTarget.querySelector(
'button[type="submit"]'
);


const visaInput =
document.getElementById(
"visa-number"
);


const passportInput =
document.getElementById(
"visa-passport"
);


const robotInput =
document.getElementById(
"visa-robot"
);


if(
!result ||
!button ||
!visaInput ||
!passportInput ||
!robotInput
){

console.error(
"Required visa form elements are missing."
);

return;

}


const visaNumber =
normalize(
visaInput.value
);


const passport =
normalize(
passportInput.value
);


const robot =
robotInput.checked;


if(
config.visaCheckEnabled === false
){

showMessage(
result,
"result-notice",
"Visa verification is temporarily unavailable. Please try again later."
);

return;

}


if(
!visaNumber ||
!passport
){

showMessage(
result,
"result-error",
"Please enter both Visa Number and Passport Number."
);

return;

}


if(!robot){

showMessage(
result,
"result-error",
"Please confirm that you are not a robot."
);

return;

}


button.disabled = true;


showMessage(
result,
"result-loading",
"Checking visa record..."
);


try{

const records =
await loadJson(

config.visaDataFile ||
"visas.json"

);


const record =
records.find(function(item){

const itemVisaNumber =
normalize(
item.visa_number ||
item.visanumber
);

const itemPassport =
normalize(
item.passport ||
item.passport_number
);

return (
itemVisaNumber === visaNumber
&&
itemPassport === passport
);

});


if(!record){

showMessage(
result,
"result-error",
"No matching visa record was found. Please check the information and try again."
);

return;

}


const output =
buildVisaResult(record);


result.innerHTML =
output.html;


mountImage(

"visa-sticker-panel",

output.candidates,

"Visa sticker for " +
output.fullName

);


result.scrollIntoView({

behavior:"smooth",

block:"start"

});


}catch(error){

console.error(
"Visa database error:",
error
);


showMessage(
result,
"result-error",
"The verification database could not be loaded. Please check visas.json."
);


}finally{

button.disabled = false;

}

}


/* =========================================================
   APPLICATION SEARCH
========================================================= */

async function handleApplicationSearch(event){

event.preventDefault();


const result =
document.getElementById(
"application-result"
);


const button =
event.currentTarget.querySelector(
'button[type="submit"]'
);


const invitationInput =
document.getElementById(
"invitation-number"
);


const passportInput =
document.getElementById(
"application-passport"
);


const robotInput =
document.getElementById(
"application-robot"
);


if(
!result ||
!button ||
!invitationInput ||
!passportInput ||
!robotInput
){

console.error(
"Required application form elements are missing."
);

return;

}


const invitation =
normalize(
invitationInput.value
);


const passport =
normalize(
passportInput.value
);


const robot =
robotInput.checked;


if(
config.applicationCheckEnabled === false
){

showMessage(
result,
"result-notice",
"Application verification is temporarily unavailable. Please try again later."
);

return;

}


if(
!invitation ||
!passport
){

showMessage(
result,
"result-error",
"Please enter both Invitation Number and Passport Number."
);

return;

}


if(!robot){

showMessage(
result,
"result-error",
"Please confirm that you are not a robot."
);

return;

}


button.disabled = true;


showMessage(
result,
"result-loading",
"Checking invitation record..."
);


try{

const records =
await loadJson(

config.applicationDataFile ||
"applications.json"

);


const record =
records.find(function(item){

const itemInvitation =
normalize(

item.invitation_number ||
item.application_number

);


const itemPassport =
normalize(

item.passport ||
item.passport_number

);


return (
itemInvitation === invitation
&&
itemPassport === passport
);

});


if(!record){

showMessage(
result,
"result-error",
"No matching invitation record was found. Please check the information and try again."
);

return;

}


const output =
buildApplicationResult(record);


result.innerHTML =
output.html;


mountImage(

"application-photo-panel",

output.candidates,

"Applicant photo for " +
output.fullName

);


result.scrollIntoView({

behavior:"smooth",

block:"start"

});


}catch(error){

console.error(
"Application database error:",
error
);


showMessage(
result,
"result-error",
"The verification database could not be loaded. Please check applications.json."
);


}finally{

button.disabled = false;

}

}


/* =========================================================
   RESET SEARCH
========================================================= */

function resetSearch(type){

const form =
document.getElementById(

type === "visa"
? "visa-form"
: "application-form"

);


const result =
document.getElementById(

type === "visa"
? "visa-result"
: "application-result"

);


if(form){

form.reset();

}


if(result){

result.innerHTML = "";

}


const firstInput =
form
? form.querySelector(
'input[type="text"]'
)
: null;


if(firstInput){

firstInput.focus();

}


window.scrollTo({

top:0,

behavior:"smooth"

});

}


/* =========================================================
   CONFIGURATION VALUES
========================================================= */

function applyConfiguration(){

document
.querySelectorAll(
"[data-version]"
)
.forEach(function(element){

element.textContent =
config.systemVersion ||
"2.0.0";

});


document
.querySelectorAll(
"[data-support-email]"
)
.forEach(function(element){

const email =
config.supportEmail ||
"evisa@mfa.gov.md";


element.textContent =
email;


element.href =
"mailto:" + email;

});

}


/* =========================================================
   RESET BUTTON EVENT
========================================================= */

document.addEventListener(
"click",
function(event){

const button =
event.target.closest(
"[data-reset]"
);


if(button){

resetSearch(
button.dataset.reset
);

}

}
);


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
"DOMContentLoaded",
function(){

applyConfiguration();


const visaForm =
document.getElementById(
"visa-form"
);


if(visaForm){

visaForm.addEventListener(
"submit",
handleVisaSearch
);

}


const applicationForm =
document.getElementById(
"application-form"
);


if(applicationForm){

applicationForm.addEventListener(
"submit",
handleApplicationSearch
);

}

}
);


})();
