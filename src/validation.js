function isNonEmptyString(value, maximumLength) {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.length <= maximumLength;
}

function validLoginBody(body) {
  return isNonEmptyString(body?.login, 64)
    && isNonEmptyString(body?.password, 128);
}

function validPostBody(body) {
  return isNonEmptyString(body?.title, 120)
    && isNonEmptyString(body?.content, 2000);
}

module.exports = { validLoginBody, validPostBody };
