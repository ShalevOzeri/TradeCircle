// Wraps an axios promise to expose .done()/.fail()/.always() so the existing
// web app code works without any changes. Mobile code uses the raw promise directly.
//
// jQuery's .fail() handler receives a jqXHR-like object; we simulate it with
// { responseJSON, status } so `xhr.responseJSON?.message` continues to work.

function wrap(axiosPromise) {
  const p = axiosPromise.then((res) => res.data);

  p.done = (cb) => {
    p.then(cb).catch(() => {});
    return p;
  };

  p.fail = (cb) => {
    p.catch((err) => {
      cb({
        responseJSON: err.response?.data ?? null,
        status: err.response?.status ?? 0,
        statusText: err.response?.statusText ?? '',
      });
    });
    return p;
  };

  p.always = (cb) => {
    p.finally(cb).catch(() => {});
    return p;
  };

  return p;
}

module.exports = { wrap };
