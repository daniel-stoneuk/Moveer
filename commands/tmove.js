const moveerMessage = require('../moveerMessage.js')
const helper = require('../helpers/helper.js')
const check = require('../helpers/check.js')

async function move(args, message, rabbitMqChannel) {
  try {
    let toVoiceChannelName = args[0]
    let roleName = args[1]
    if (args.join().includes('"')) {
      const names = helper.getNameWithSpacesName(args, message.author.id)
      toVoiceChannelName = names[0]
      roleName = names[1]
    }
    await check.ifTextChannelIsMoveerAdmin(message)
    check.argsLength(args, 1)
    check.ifMessageContainsMentions(message)
    const toVoiceChannel = helper.getChannelByName(message, toVoiceChannelName)
    check.ifVoiceChannelExist(message, toVoiceChannel, toVoiceChannelName)
    let usersToMove = helper.getUsersByRole(message, roleName)
    usersToMove = check.ifUserInsideBlockedChannel(message, usersToMove)
    usersToMove = check.ifMentionsInsideVoiceChannel(message, usersToMove)
    usersToMove = check.ifUsersAlreadyInChannel(message, usersToMove, toVoiceChannel.id)
    const userIdsToMove = await usersToMove.map(({ id }) => id)
    await check.forMovePerms(message, userIdsToMove, toVoiceChannel)
    await check.forConnectPerms(message, userIdsToMove, toVoiceChannel)

    // No errors in the message, lets get moving!
    userIdsToMove.length > 0
      ? helper.moveUsers(message, userIdsToMove, toVoiceChannel.id, rabbitMqChannel)
      : moveerMessage.sendMessage(message, moveerMessage.USER_ALREADY_IN_CHANNEL('Everyone'))
  } catch (err) {
    console.log('throwing')
    if (!err.logMessage) console.log(err)
    moveerMessage.logger(message, err.logMessage)
    moveerMessage.sendMessage(message, err.sendMessage)
  }
}

module.exports = {
  move,
}
