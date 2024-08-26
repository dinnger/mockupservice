import { db } from '../database/connect.js'
import axios from 'axios'

const headersList = {
  Accept: 'application/json',
  Authorization: 'Basic d3JvbnF1aWxsb2RlQHRpZ28uY29tLmd0OkFUQVRUM3hGZkdGMElLekN0bkkyV0FtTFlpcFV5NGc5elhrQ1ZHWjYxV3BmSHJNRDVVOXNsWlVPdHNiNENvNUJ2UzRpY2xFZ25GTElWNzc2R1dFb0kzXzBmcFQ2ZGN0U3JrUVphcjJYaUNEYVdvbkdLQUY0bnB0M2VwaUstb1lHZVMwUkZPQ0lJdXdHUUR3dE1aeG1lVzJVUXM0RGhLRmpqUFk0ZGMweDJUMnJ6eGVoUDhoLTVmUT1EQjk1M0ZBRg==',
  'Content-Type': 'application/json'
}

export default function Jira ({ el } = {}) {
  return {
    issue: async ({ socket, session, ...params }) => {
      return {
        async create ({ socket, session, ...params }) {
          const bodyContent = JSON.stringify({
            fields: {
              project: {
                key: 'IMI'
              },
              issuetype: {
                id: '10163',
                subtask: true
              },
              description: {
                content: [
                  {
                    content: [
                      {
                        text: params.content,
                        type: 'text'
                      }
                    ],
                    type: 'paragraph'
                  }
                ],
                type: 'doc',
                version: 1
              },
              parent: {
                key: 'IMI-1493'
              },
              summary: socket?.session?.alias + ' - ' + params.summary
            },
            update: {}
          })

          const reqOptions = {
            url: 'https://dinnger.atlassian.net/rest/api/3/issue/',
            method: 'POST',
            headers: headersList,
            data: bodyContent
          }

          await axios.request(reqOptions)
            .then(async (resp) => {
              const key = resp.data.key
              const headersList = {
                'X-Atlassian-Token': 'no-check',
                Authorization: 'Basic d3JvbnF1aWxsb2RlQHRpZ28uY29tLmd0OkFUQVRUM3hGZkdGMElLekN0bkkyV0FtTFlpcFV5NGc5elhrQ1ZHWjYxV3BmSHJNRDVVOXNsWlVPdHNiNENvNUJ2UzRpY2xFZ25GTElWNzc2R1dFb0kzXzBmcFQ2ZGN0U3JrUVphcjJYaUNEYVdvbkdLQUY0bnB0M2VwaUstb1lHZVMwUkZPQ0lJdXdHUUR3dE1aeG1lVzJVUXM0RGhLRmpqUFk0ZGMweDJUMnJ6eGVoUDhoLTVmUT1EQjk1M0ZBRg=='
              }

              for (let index = 0; index < params.uris.length; index++) {
                const uri = params.uris[index]
                const file = new Blob([uri], { type: uri.type })
                const formdata = new FormData()
                formdata.append('file', file, `video_${index + 1}.webm`)
                const bodyContent = formdata
                const reqOptions = {
                  url: `https://dinnger.atlassian.net/rest/api/3/issue/${key}/attachments`,
                  method: 'POST',
                  headers: headersList,
                  data: bodyContent
                }

                await axios.request(reqOptions)
              }
              return resp.data
            })
          return null
        }
      }
    },
    // jira/assigned
    assigned: async ({ socket, session, ...params }) => {
      return {
        async save ({ url, email, token, session, ...params }) {
          try {
            await db.SECURITY.USERS.update({
              jira: {
                url,
                token: Buffer.from(email + ':' + token).toString('base64')
              }
            }, {
              where: {
                alias: session.alias
              }
            })
            return true
          } catch (error) {
            return { error: error.toString() }
          }
        },
        // Se encarga de extraer los tickets asignados a un usuario del Jira
        // jira/assigned/get
        async get ({ socket, session, ...params }) {
          if (!session || !session.alias) return []

          const user = await db.SECURITY.USERS.findOne({
            where: {
              alias: session.alias
            }
          })

          if (!user || !user.jira || !user.jira.url) return null

          const urlJira = user.jira.url
          const headersList = {
            Accept: 'application/json',
            Authorization: 'Basic ' + user.jira.token,
            'Content-Type': 'application/json'
          }

          const data = JSON.stringify({
            jql: 'assignee=currentuser()',
            expand: [
              'names',
              'schema',
              'operations'
            ],
            fields: [
              'summary',
              'status',
              'assignee'
            ]
          })
          const reqOptions = {
            url: urlJira + '/rest/api/3/search',
            method: 'POST',
            headers: headersList,
            data
          }

          try {
            // console.log(reqOptions)
            const resp = await axios.request(reqOptions)
            return resp.data.issues.map(issue => {
              return {
                key: issue.key,
                url: urlJira + '/browse/' + issue.key,
                summary: issue.fields.summary,
                status: issue.fields.status.name
              }
            })
          } catch (e) {
            console.log(e.toString())
            return []
          }
        }
      }
    }

  }
}
