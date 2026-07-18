(function(){

"use strict";

const config = window.EVISA_CONFIG || {};

function normalize(value){

return String(value || "")
.trim()
.toUpperCase()
.replace(/\s+/g, "");

}

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

function statusClass(status){

const text = String(status || "").toLowerCase();

if(text.includes("approved")){
return "status-approved";
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

if(
text.includes("invalid") ||
text.includes("expired")
){
return "status-invalid";
}

return "";

}

async function loadJson(file){

const response = await fetch(
file + "?v=" + Date.now(),
{
cache:"no-store"
}
);

if(!response.ok){
throw new Error("Unable to load " + file);
}

const data = await response.json();

if(!Array.isArray(data)){
throw new Error(file + " must contain an array");
}

return data;

}

function showMessage(container,type,message){

container.innerHTML =
'<div class="' +
type +
'">' +
safe(message) +
'</div>';

}

function createImageCandidates(
folder,
preferredName,
fallbackName
){

const extensions =
config.imageExtensions ||
["jpg","jpeg","png","webp"];

const candidates = [];

function addName(name){

if(!name){
return;
}

const cleanName =
String(name).replace(/^\/+/,"");

const hasExtension =
/\.[a-z0-9]+$/i.test(cleanName);

if(cleanName.includes("/")){

candidates.push(cleanName);

}else{

candidates.push(folder + cleanName);

/* পুরোনো main folder fallback */

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

image.alt = altText;
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

image.src = candidates[index];

index++;

}

image.onerror = tryNext;

container.innerHTML = "";

container.appendChild(image);

tryNext();

}

function detailRows(rows){

return rows.map(function(row){

const label = row[0];
const value = row[1];
const className = row[2] || "";

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

const stickerName =
record.sticker ||
record.sticker_file ||
record.visa_number;

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
record.dob
],

[
"Nationality",
record.nationality ||
record.citizenship
],

[
"Passport Number",
record.passport
],

[
"Visa Number",
record.visa_number
],

[
"Visa Category",
record.visatype ||
record.visa_category
],

[
"Issued From",
record.issue_place ||
record.issued_from
],

[
"Issue Date",
record.issue_date
],

[
"Expiry Date",
record.expiry_date
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
record.photo_file;

const fallbackPhoto =
record.passport;

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
record.nationality ||
record.citizenship
],

[
"Passport Number",
record.passport
],

[
"Invitation Number",
record.invitation_number
],

[
"Invitation Type",
record.invitation_type
],

[
"Invitation Issue Date",
record.issue_date
],

[
"Invitation Expiry Date",
record.expiry_date
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

async function handleVisaSearch(event){

event.preventDefault();

const result =
document.getElementById("visa-result");

const button =
event.currentTarget.querySelector(
'button[type="submit"]'
);

const visaNumber =
normalize(
document.getElementById(
"visa-number"
).value
);

const passport =
normalize(
document.getElementById(
"visa-passport"
).value
);

const robot =
document.getElementById(
"visa-robot"
).checked;

if(config.visaCheckEnabled === false){

showMessage(
result,
"result-notice",
"Visa verification is temporarily unavailable. Please try again later."
);

return;

}

if(!visaNumber || !passport){

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

return (
normalize(item.visa_number) ===
visaNumber
&&
normalize(item.passport) ===
passport
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

console.error(error);

showMessage(
result,
"result-error",
"The verification database could not be loaded. Please check visas.json."
);

}finally{

button.disabled = false;

}

}

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

const invitation =
normalize(
document.getElementById(
"invitation-number"
).value
);

const passport =
normalize(
document.getElementById(
"application-passport"
).value
);

const robot =
document.getElementById(
"application-robot"
).checked;

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

if(!invitation || !passport){

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

return (
normalize(
item.invitation_number
) === invitation
&&
normalize(item.passport) ===
passport
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

console.error(error);

showMessage(
result,
"result-error",
"The verification database could not be loaded. Please check applications.json."
);

}finally{

button.disabled = false;

}

}

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
form ? form.querySelector("input") : null;

if(firstInput){
firstInput.focus();
}

window.scrollTo({
top:0,
behavior:"smooth"
});

}

function applyConfiguration(){

document
.querySelectorAll("[data-version]")
.forEach(function(element){

element.textContent =
config.systemVersion ||
"2.0.0";

});

document
.querySelectorAll("[data-support-email]")
.forEach(function(element){

const email =
config.supportEmail ||
"evisa@mfa.gov.md";

element.textContent = email;

element.href =
"mailto:" + email;

});

}

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
