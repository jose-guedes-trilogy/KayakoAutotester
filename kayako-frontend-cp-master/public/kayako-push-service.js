window.kayakoPushService = {}

window.kayakoPushService.register = function (registerFn, filePath) {
  return registerFn(filePath)
}
