
requests = require "../../common/requests"
User.defineRequest "all", requests.all, requests.checkError
CozyInstance.defineRequest "all", requests.all, requests.checkError

allSlug = -> emit doc.slug, doc
Application.defineRequest "all", allSlug, requests.checkError