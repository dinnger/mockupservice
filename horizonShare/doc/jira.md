import axios from "axios";

let headersList = {
 "Accept": "application/json",
 "User-Agent": "Thunder Client (https://www.thunderclient.com)",
 "Authorization": "Basic d3JvbnF1aWxsb2RlQHRpZ28uY29tLmd0OkFUQVRUM3hGZkdGMElLekN0bkkyV0FtTFlpcFV5NGc5elhrQ1ZHWjYxV3BmSHJNRDVVOXNsWlVPdHNiNENvNUJ2UzRpY2xFZ25GTElWNzc2R1dFb0kzXzBmcFQ2ZGN0U3JrUVphcjJYaUNEYVdvbkdLQUY0bnB0M2VwaUstb1lHZVMwUkZPQ0lJdXdHUUR3dE1aeG1lVzJVUXM0RGhLRmpqUFk0ZGMweDJUMnJ6eGVoUDhoLTVmUT1EQjk1M0ZBRg==",
 "Content-Type": "application/json" 
}

let bodyContent = JSON.stringify({
  "fields": {
    "project": {
      "key": "IMI"
    },
    "issuetype": {
      "id": "10163",
      "subtask": true
    },
    "description": {
      "content": [
        {
          "content": [
            {
              "text": "Order entry fails when selecting supplier.",
              "type": "text"
            }
          ],
          "type": "paragraph"
        }
      ],
      "type": "doc",
      "version": 1
    },
    "parent": {
      "key": "IMI-1493"
    },
    "summary": "Main order flow broken"
  },
  "update": {}
});

let reqOptions = {
  url: "https://dinnger-guatemala.atlassian.net/rest/api/3/issue/",
  method: "POST",
  headers: headersList,
  data: bodyContent,
}

let response = await axios.request(reqOptions);
console.log(response.data);



-------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------

import axios from "axios";
var fs = require('fs');

let headersList = {
 "User-Agent": "Thunder Client (https://www.thunderclient.com)",
 "X-Atlassian-Token": "no-check",
 "Authorization": "Basic d3JvbnF1aWxsb2RlQHRpZ28uY29tLmd0OkFUQVRUM3hGZkdGMElLekN0bkkyV0FtTFlpcFV5NGc5elhrQ1ZHWjYxV3BmSHJNRDVVOXNsWlVPdHNiNENvNUJ2UzRpY2xFZ25GTElWNzc2R1dFb0kzXzBmcFQ2ZGN0U3JrUVphcjJYaUNEYVdvbkdLQUY0bnB0M2VwaUstb1lHZVMwUkZPQ0lJdXdHUUR3dE1aeG1lVzJVUXM0RGhLRmpqUFk0ZGMweDJUMnJ6eGVoUDhoLTVmUT1EQjk1M0ZBRg==" 
}

let formdata = new FormData();
formdata.append("file", fs.createReadStream("c:\Users\WO199\Downloads\captura.webm"));

let bodyContent =  formdata;

let reqOptions = {
  url: "https://dinnger-guatemala.atlassian.net/rest/api/3/issue/IMI-1496/attachments",
  method: "POST",
  headers: headersList,
  data: bodyContent,
}

let response = await axios.request(reqOptions);
console.log(response.data);

-------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------

https://dinnger-guatemala.atlassian.net/rest/api/3/attachment/49591


import axios from "axios";

let headersList = {
 "User-Agent": "Thunder Client (https://www.thunderclient.com)",
 "Accept": "application/json",
 "Authorization": "Basic d3JvbnF1aWxsb2RlQHRpZ28uY29tLmd0OkFUQVRUM3hGZkdGMElLekN0bkkyV0FtTFlpcFV5NGc5elhrQ1ZHWjYxV3BmSHJNRDVVOXNsWlVPdHNiNENvNUJ2UzRpY2xFZ25GTElWNzc2R1dFb0kzXzBmcFQ2ZGN0U3JrUVphcjJYaUNEYVdvbkdLQUY0bnB0M2VwaUstb1lHZVMwUkZPQ0lJdXdHUUR3dE1aeG1lVzJVUXM0RGhLRmpqUFk0ZGMweDJUMnJ6eGVoUDhoLTVmUT1EQjk1M0ZBRg==",
 "Content-Type": "application/json" 
}

let bodyContent = JSON.stringify({
  "body": {
    "content": [
      {
        "type": "mediaSingle",
        "content": [
          {
            "type": "media",
            "attrs": {
              "type": "external",
              "url": "https://dinnger-guatemala.atlassian.net/rest/api/3/attachment/49591",
              "width": 710,
              "height": 163
            }
          }
        ]
      },
      {
        "content": [
          {
            "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eget venenatis elit. Duis eu justo eget augue iaculis fermentum. Sed semper quam laoreet nisi egestas at posuere augue semper.",
            "type": "text"
          }
        ],
        "type": "paragraph"
      }
    ],
    "type": "doc",
    "version": 1
  },
  "visibility": {
    "identifier": "Administrators",
    "type": "role",
    "value": "Administrators"
  }
});

let reqOptions = {
  url: "https://dinnger-guatemala.atlassian.net/rest/api/3/attachment/49595",
  method: "GET",
  headers: headersList,
  data: bodyContent,
}

let response = await axios.request(reqOptions);
console.log(response.data);
