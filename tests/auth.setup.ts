import {test as setup} from '@playwright/test';

setup('Authentication', async ({page}) => {

    const authFile = '.auth/user.json'

    await page.goto('https://conduit.bondaracademy.com/')
    await page.getByText('Sign in').click()
    await page.getByRole('textbox', {name: "Email"}).fill("pwtestuser@test.com")
    await page.getByRole('textbox', {name: "Password"}).fill("pwtest")
    await page.getByRole('button').click()
    await page.waitForResponse('https://conduit-api.bondaracademy.com/tags')

    await page.context().storageState({path: authFile})


})