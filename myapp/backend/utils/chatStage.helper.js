function getChatStage(user) {
  if (!user || !user.womenCategory) {
    return null;
  }

  return user.womenCategory; // SIMPLE
}

module.exports = { getChatStage };
