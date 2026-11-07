import type { Access, Where } from 'payload'

export const publishedContent: Access = ({ req }) =>
  req.user ? true : { _status: { equals: 'published' } }
export const activePublishedContent: Access = ({ req }): boolean | Where =>
  req.user
    ? true
    : {
        and: [{ _status: { equals: 'published' } }, { active: { equals: true } }],
      }
