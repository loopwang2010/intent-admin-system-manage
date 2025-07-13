console.log('Loading controller...')

try {
  const controller = require('./src/controllers/coreIntentController')
  console.log('Controller loaded:', !!controller)
  console.log('Controller:', controller)
  console.log('Type of controller:', typeof controller)
  console.log('Keys:', Object.keys(controller))
  console.log('getList exists:', 'getList' in controller)
  console.log('getList type:', typeof controller.getList)
} catch (e) {
  console.log('Error loading controller:', e.message)
  console.log('Stack:', e.stack)
} 