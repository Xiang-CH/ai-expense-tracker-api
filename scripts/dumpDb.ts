async function dumpDb() {
  const users = Bun.file('db/users.json')
  const userData = await users.json()
  const userString = JSON.stringify(userData)

  // Read existing .env file
  const envFile = Bun.file('.env')
  let envContent = await envFile.text()

  // Check if USER_INFO already exists
  const userInfoRegex = /USER_INFO=[\s\S]*?(?=\n[A-Z_]+=|\n*$)/

  const newUserInfo = `USER_INFO="${userString}"`

  if (userInfoRegex.test(envContent)) {
    // Replace existing USER_INFO
    envContent = envContent.replace(userInfoRegex, newUserInfo)
  } else {
    // Add USER_INFO at the end
    envContent = envContent.trim() + '\n\n' + newUserInfo
  }

  // Write back to .env file
  await Bun.write('.env', envContent)

  console.log('Successfully updated USER_INFO in .env file')
}

dumpDb()
