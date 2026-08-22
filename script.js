(function(){

"use strict";

const config = window.EVISA_CONFIG || {};


/* =========================================================
   NORMALIZE
========================================================= */

function normalize(value){

return String(value || "")
.trim()
.toUpperCase()
.replace(/\s+/g, "");

}


/* =========================================================
   SAFE OUTPUT
========================================================= */

function safe(value){

const text =
value === undefined ||
value === null ||
value === ""
? "—"
: String(value);

return text.replace(/[&<>"']/g,function(character){

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
   STATUS COLOR
========================================================= */

function statusClass(status){

const text =
String(status || "")
.toLowerCase();

if(text.includes("approved")){
return "status-approved";
}

if(
text.includes("invalid") ||
text.includes("expired")
){
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
   LOAD JSON

   Supports:

   {
     "records":[...]
   }

   OR

   [
     {...}
   ]
========================================================= */

async function loadJson(file){

const response =
await fetch(

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


if(Array.isArray(data)){

return data;

}


if(
data &&
Array.isArray(data.records)
){

return data.records;

}


if(
data &&
Array.isArray(data.visas)
){

return data.visas;

}


throw new Error(
file + " must contain an array or records array."
);

}


/* =========================================================
   MESSAGE
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
   IMAGE CANDIDATES
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


if(cleanName.includes("/")){

candidates.push(cleanName);

}else{

/* New folder */

candidates.push(
folder + cleanName
);


/* Old root fallback */

candidates.push(cleanName);

}


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


return [...new Set(candidates)];

}


/* =========================================================
   DISPLAY IMAGE
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
altText || "Verification document";

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
   TABLE
========================================================= */

function detailRows(rows){

return rows.map(function(row){

const label = row[0];
const value = row[1];
const className = row[2] || "";

return `

<tr>

<th>
${safe(label)}
</th>

<td class="${className}">
${safe(value)}
</td>

</tr>

`;

}).join("");

}


/* =========================================================
   FULL NAME
========================================================= */

function getFullName(record){

return record.full_name ||

[
record.firstname,
record.surname
]
.filter(Boolean)
.join(" ");

}


/* =========================================================
   IDENTIFY NEW VISA STICKER RECORD

   IMPORTANT:
   Invitation issue_date will NOT make it a visa.
========================================================= */

function isStickerRecord(record){

const type =
normalize(

record.type ||
record.record_type

);

return Boolean(

type === "VISA" ||

record.sticker ||

record.sticker_file

);

}


/* =========================================================
   NEW VISA STICKER RESULT
========================================================= */

function buildStickerVisaResult(record){

const fullName =
getFullName(record);

const status =
record.status || "—";

const stickerName =
record.sticker ||
record.sticker_file ||
record.visa_number;

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
record.issued_date;

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
id="visa-result-image"
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

imageId:"visa-result-image",

fullName:fullName,

imageAlt:
"Visa sticker for " + fullName

};

}


/* =========================================================
   OLD CUSTOMER RESULT

   IMPORTANT:
   Old records remain unchanged.
   Old applicant photo still works.
========================================================= */

function buildLegacyResult(
record,
resetType
){

const fullName =
getFullName(record);

const status =
record.status || "—";

const photoName =

record.photo ||
record.photo_file ||
record.applicant_photo;

const nationality =

record.nationality ||
record.citizenship;

const number =

record.invitation_number ||
record.application_number ||
record.visa_number ||
record.visanumber;

const visaType =

record.visatype ||
record.visa_category ||
record.visa_type;

const purpose =

record.purpose ||
record.invitation_type ||
record.application_type;

const validity =

record.validity ||
record.expiry_date ||
record.expiry ||
record.valid_until;


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
id="legacy-result-image"
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
"Invitation Number",
number
],

[
"Invitation Type",
visaType
],

[
"Purpose",
purpose
],

[
"Validity",
validity
]

])}

</tbody>

</table>

</div>


<div class="result-actions">

<button
type="button"
class="search-again"
data-reset="${resetType}">

Another Search

</button>

</div>

</section>

`;


/*
Old customer images still use applicant-photos,
then root fallback.
*/

const candidates =
createImageCandidates(

config.applicantPhotoFolder ||
"assets/applicant-photos/",

photoName,

record.passport ||
record.passport_number

);


return {

html:html,

candidates:candidates,

imageId:"legacy-result-image",

fullName:fullName,

imageAlt:
"Applicant photo for " + fullName

};

}


/* =========================================================
   NEW INVITATION RESULT

   IMPORTANT:
   Uses ORIGINAL Immigration Invitation Number.

   Example:
   invitation_number = IGM945877

   Image automatically searched as:
   assets/invitations/IGM945877.jpg
   assets/invitations/IGM945877.png
   etc.
========================================================= */

function buildInvitationResult(record){

const fullName =
getFullName(record);

const status =

record.status ||
record.invitation_status ||
"—";

const nationality =

record.nationality ||
record.citizenship;

const invitationNumber =

record.invitation_number ||
record.application_number;

const invitationType =

record.invitation_type ||
record.application_type ||
record.visatype;

const issueDate =

record.issue_date ||
record.invitation_issue_date;

const expiryDate =

record.expiry_date ||
record.validity ||
record.invitation_expiry_date;


/*
OPTIONAL custom filename.

If invitation_image is absent,
the ORIGINAL invitation number is used automatically.
*/

const invitationImage =

record.invitation_image ||
record.invitation_file ||
record.invitation_photo ||
invitationNumber;


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
id="application-result-image"
class="media-panel sticker-panel">
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
"Invitation Number",
invitationNumber
],

[
"Invitation Type",
invitationType
],

[
"Purpose",
record.purpose
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


/*
New Invitation Paper:
assets/invitations/IGM945877.jpg
*/

const candidates =
createImageCandidates(

config.invitationFolder ||
"assets/invitations/",

invitationImage,

invitationNumber

);


return {

html:html,

candidates:candidates,

imageId:"application-result-image",

fullName:fullName,

imageAlt:
"Invitation document for " + fullName

};

}


/* =========================================================
   VISA CHECK
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
"Checking verification record..."
);


try{


const records =
await loadJson(

config.visaDataFile ||
"visas.json"

);


/*
Check Visa:

1. New Visa records:
   type = visa

2. Old legacy records:
   no type field
*/

const record =
records.find(function(item){


const type =
normalize(

item.type ||
item.record_type

);


/*
Do NOT allow NEW invitation records
to behave as Visa records.
*/

if(type === "INVITATION"){

return false;

}


const itemNumber =
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

itemNumber === visaNumber &&

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


let output;


/*
New Visa Sticker
*/

if(isStickerRecord(record)){

output =
buildStickerVisaResult(record);

}else{

/*
Old customer compatibility
*/

output =
buildLegacyResult(
record,
"visa"
);

}


result.innerHTML =
output.html;


mountImage(

output.imageId,

output.candidates,

output.imageAlt

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
   APPLICATION / INVITATION CHECK
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

config.visaDataFile ||
"visas.json"

);


const record =
records.find(function(item){


const type =
normalize(

item.type ||
item.record_type

);


const itemPassport =
normalize(

item.passport ||
item.passport_number

);


/*
NEW invitation:

Uses original immigration number:
IGM945877
*/

if(type === "INVITATION"){

const itemInvitation =
normalize(

item.invitation_number ||
item.application_number

);

return (

itemInvitation === invitation &&

itemPassport === passport

);

}


/*
OLD RECORD COMPATIBILITY

Old customers used visa_number
as their old invitation/search number.
*/

const legacyNumber =
normalize(

item.visa_number ||
item.visanumber

);


return (

legacyNumber === invitation &&

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


const type =
normalize(

record.type ||
record.record_type

);


let output;


/*
New invitation document
*/

if(type === "INVITATION"){

output =
buildInvitationResult(record);

}else{

/*
Old customer
*/

output =
buildLegacyResult(
record,
"application"
);

}


result.innerHTML =
output.html;


mountImage(

output.imageId,

output.candidates,

output.imageAlt

);


result.scrollIntoView({

behavior:"smooth",

block:"start"

});


}catch(error){

console.error(
"Invitation database error:",
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
   RESET
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
   CONFIG
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
   RESET BUTTON
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
   INITIALIZE
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
