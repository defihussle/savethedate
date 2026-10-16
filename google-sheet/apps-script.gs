// Paste this into the Wedding planner spreadsheet (Extensions → Apps Script) and deploy it
// as a web app (Execute as: Me, Who has access: Anyone). The site posts each "Share your
// details" form to the web app URL, set as `sheetEndpoint` in src/config.js.
//
// Each response is added under "Website Responses" at the bottom of the Guest List tab.

function doPost(e) {
  var p = e.parameter;
  if (p['bot-field']) return ContentService.createTextOutput('ok'); // spam trap

  var row = new Array(16).fill('');
  row[0] = p.names || '';           // A  Guest Name
  row[2] = 'Website';               // C  Relationship
  row[8] = p.address || '';         // I  Mailing Address
  row[14] = p.accommodations || ''; // O  Notes
  row[15] = new Date();             // P  Submitted

  SpreadsheetApp.getActive().getSheetByName('Guest List').appendRow(row);
  return ContentService.createTextOutput('ok');
}
