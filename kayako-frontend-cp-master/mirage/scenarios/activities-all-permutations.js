// this just creates the ones not created by posts-all-permutations

export default function activities(server, customer, customerIdentity, agent, agentIdentity) {
  loggedIn(server, agent);
  builtReport(server, agent);
  updatedUser(server, agent);
}

function loggedIn(server, user) {
  // {
  //     "id": 198,
  //     "activity": "log_in",
  //     "actor": {
  //         "name": "user",
  //         "title": "Testy McTester",
  //         "prefix": "@",
  //         "url": "https://minutebase.kayako.com/Base/User/9",
  //         "full_title": "Testy McTester",
  //         "image": "https://minutebase.kayako.com/avatar/get/09b3d790-d727-56fe-a508-6275f744fcda?1490196834",
  //         "preposition": "of",
  //         "original": {
  //             "id": 9,
  //             "resource_type": "user"
  //         },
  //         "resource_type": "activity_actor"
  //     },
  //     "verb": "LOGIN",
  //     "summary": "<@https://minutebase.kayako.com/Base/User/9|Testy McTester> logged in",
  //     "actions": [],
  //     "object": null,
  //     "object_actor": null,
  //     "location": null,
  //     "place": null,
  //     "target": null,
  //     "result": null,
  //     "in_reply_to": null,
  //     "participant": null,
  //     "portal": "API",
  //     "weight": 0.01,
  //     "ip_address": "109.159.159.194",
  //     "created_at": "2017-02-07T14:59:46+00:00",
  //     "resource_type": "activity"
  // },
}

function builtReport() {
  // {
  //    "id": 201,
  //    "activity": "build_report",
  //    "actor": {
  //        "name": "user",
  //        "title": "Testy McTester",
  //        "prefix": "@",
  //        "url": "https://minutebase.kayako.com/Base/User/9",
  //        "full_title": "Testy McTester",
  //        "image": "https://minutebase.kayako.com/avatar/get/09b3d790-d727-56fe-a508-6275f744fcda?1490196834",
  //        "preposition": "of",
  //        "original": {
  //            "id": 9,
  //            "resource_type": "user"
  //        },
  //        "resource_type": "activity_actor"
  //    },
  //    "verb": "BUILD",
  //    "summary": "<@https://minutebase.kayako.com/Base/User/9|Testy McTester> built Testing 3",
  //    "actions": [],
  //    "object": {
  //        "name": "report",
  //        "title": "Testing 3",
  //        "prefix": "",
  //        "url": null,
  //        "full_title": "Testing 3",
  //        "image": "",
  //        "preposition": null,
  //        "original": {
  //            "id": 1,
  //            "resource_type": "report"
  //        },
  //        "resource_type": "activity_object"
  //    },
  //    "object_actor": null,
  //    "location": null,
  //    "place": null,
  //    "target": null,
  //    "result": {
  //        "name": "report",
  //        "title": "Testing 3",
  //        "prefix": "",
  //        "url": null,
  //        "full_title": "Testing 3",
  //        "image": "",
  //        "preposition": null,
  //        "original": {
  //            "id": 1,
  //            "resource_type": "report"
  //        },
  //        "resource_type": "activity_result"
  //    },
  //    "in_reply_to": null,
  //    "participant": null,
  //    "portal": "API",
  //    "weight": 0.2,
  //    "ip_address": "109.159.159.194",
  //    "created_at": "2017-02-07T15:03:07+00:00",
  //    "resource_type": "activity"
  // }
}

function updatedUser() {
  // {
  //   "id": 283,
  //   "activity": "update_user",
  //   "actor": {
  //       "name": "user",
  //       "title": "Richard Livsey",
  //       "prefix": "@",
  //       "url": "https://minutebase.kayako.com/Base/User/1",
  //       "full_title": "Richard Livsey",
  //       "image": "https://minutebase.kayako.com/avatar/get/1c3cc185-384a-5f30-806b-4808f5df1e96?1490200139",
  //       "preposition": "of",
  //       "original": {
  //           "id": 1,
  //           "resource_type": "user"
  //       },
  //       "resource_type": "activity_actor"
  //   },
  //   "verb": "UPDATE",
  //   "summary": "<@https://minutebase.kayako.com/Base/User/1|Richard Livsey> updated <@https://minutebase.kayako.com/Base/User/9|Testy McTester>",
  //   "actions": [
  //       {
  //           "id": 192,
  //           "resource_type": "action"
  //       }
  //   ],
  //   "object": {
  //       "name": "user",
  //       "title": "Testy McTester",
  //       "prefix": "@",
  //       "url": "https://minutebase.kayako.com/Base/User/9",
  //       "full_title": "Testy McTester",
  //       "image": "https://minutebase.kayako.com/avatar/get/09b3d790-d727-56fe-a508-6275f744fcda?1490196834",
  //       "preposition": "of",
  //       "original": {
  //           "id": 9,
  //           "resource_type": "user"
  //       },
  //       "resource_type": "activity_object"
  //   },
  //   "object_actor": null,
  //   "location": null,
  //   "place": null,
  //   "target": null,
  //   "result": null,
  //   "in_reply_to": null,
  //   "participant": null,
  //   "portal": "API",
  //   "weight": 0.4,
  //   "ip_address": "109.159.159.194",
  //   "created_at": "2017-02-27T16:11:06+00:00",
  //   "resource_type": "activity"
  // }
}

// function updatedOrganization() {
  // {
  //           "id": 370,
  //           "activity": "update_organization",
  //           "actor": {
  //               "name": "user",
  //               "title": "Richard Livsey",
  //               "prefix": "@",
  //               "url": "https://minutebase.kayako.com/Base/User/1",
  //               "full_title": "Richard Livsey",
  //               "image": "https://minutebase.kayako.com/avatar/get/1c3cc185-384a-5f30-806b-4808f5df1e96?1490200139",
  //               "preposition": "of",
  //               "original": {
  //                   "id": 1,
  //                   "resource_type": "user"
  //               },
  //               "resource_type": "activity_actor"
  //           },
  //           "verb": "UPDATE",
  //           "summary": "<@https://minutebase.kayako.com/Base/User/1|Richard Livsey> updated <https://minutebase.kayako.com/Base/Organization/2|MinuteBase>",
  //           "actions": [],
  //           "object": {
  //               "name": "organization",
  //               "title": "MinuteBase",
  //               "prefix": "",
  //               "url": "https://minutebase.kayako.com/Base/Organization/2",
  //               "full_title": "MinuteBase",
  //               "image": "",
  //               "preposition": "of",
  //               "original": {
  //                   "id": 2,
  //                   "resource_type": "organization"
  //               },
  //               "resource_type": "activity_object"
  //           },
  //           "object_actor": null,
  //           "location": null,
  //           "place": null,
  //           "target": null,
  //           "result": null,
  //           "in_reply_to": null,
  //           "participant": null,
  //           "portal": "API",
  //           "weight": 0.4,
  //           "ip_address": "109.159.159.194",
  //           "created_at": "2017-03-13T10:53:06+00:00",
  //           "resource_type": "activity"
  //       },
// }

// function invitedAgent() {
  // {
  //          "id": 153,
  //          "activity": "agent_invite",
  //          "actor": {
  //              "name": "user",
  //              "title": "Richard Livsey",
  //              "prefix": "@",
  //              "url": "https://minutebase.kayako.com/Base/User/1",
  //              "full_title": "Richard Livsey",
  //              "image": "https://minutebase.kayako.com/avatar/get/1c3cc185-384a-5f30-806b-4808f5df1e96?1490200139",
  //              "preposition": "of",
  //              "original": {
  //                  "id": 1,
  //                  "resource_type": "user"
  //              },
  //              "resource_type": "activity_actor"
  //          },
  //          "verb": "INVITE",
  //          "summary": "<@https://minutebase.kayako.com/Base/User/1|Richard Livsey> invited <@https://minutebase.kayako.com/Base/User/9|Testy McTester>",
  //          "actions": [],
  //          "object": {
  //              "name": "user",
  //              "title": "Testy McTester",
  //              "prefix": "@",
  //              "url": "https://minutebase.kayako.com/Base/User/9",
  //              "full_title": "Testy McTester",
  //              "image": "https://minutebase.kayako.com/avatar/get/09b3d790-d727-56fe-a508-6275f744fcda?1490196834",
  //              "preposition": "of",
  //              "original": {
  //                  "id": 9,
  //                  "resource_type": "user"
  //              },
  //              "resource_type": "activity_object"
  //          },
  //          "object_actor": null,
  //          "location": null,
  //          "place": null,
  //          "target": null,
  //          "result": null,
  //          "in_reply_to": null,
  //          "participant": null,
  //          "portal": "API",
  //          "weight": 0.05,
  //          "ip_address": "109.159.159.194",
  //          "created_at": "2017-01-18T09:56:50+00:00",
  //          "resource_type": "activity"
  //      },
// }
