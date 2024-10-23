import {test, expect, request} from '@playwright/test';
import tags from '../test-data/tags.json'

test.beforeEach(async ({page}) => {
    await page.route('*/**/api/tags', async route => {
        await route.fulfill({
            body: JSON.stringify(tags)
        })
    })

    await page.goto('https://conduit.bondaracademy.com/')
    await page.getByText('Sign in').click()
    await page.getByRole('textbox', {name: "Email"}).fill("pwtestuser@test.com")
    await page.getByRole('textbox', {name: "Password"}).fill("pwtest")
    await page.getByRole('button').click()

})

test('has title', async ({page}) => {
    await page.route('*/**/api/articles*', async route => {
        const response = await route.fetch()
        const responseBody = await response.json()
        responseBody.articles[0].title = "This is a test title"
        responseBody.articles[0].description = "This is a MOCK test description"

        await route.fulfill({
            body: JSON.stringify(responseBody)
        })
    })

    await page.getByText('Global Feed')
    await expect(page.locator('.navbar-brand')).toHaveText('conduit')
    await expect(page.locator('app-article-list h1').first()).toContainText("This is a test title")
    await expect(page.locator('app-article-list p').first()).toContainText("This is a MOCK test description")
})

test('has tags', async ({page}) => {

    await expect(page.locator('.sidebar')).toContainText('Test');
    await expect(page.locator('.sidebar')).toContainText('GitHub');

})

test('delete article', async ({page, request}) => {
    const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
        data: {
            "user": {"email": "pwtestuser@test.com", "password": "pwtest"}
        }
    })
    const responseBody = await response.json()
    const accessToken = responseBody.user.token

    const articleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles', {
        data: {
            "article": {
                "title": "This is an article title",
                "description": "This is an article description",
                "body": "This is an article's body",
                "tagList": []
            }
        },
        headers: {
            Authorization: `Token ${accessToken}`
        }
    })

    expect(articleResponse.status()).toEqual(201)

    await page.getByText('Global Feed').click()
    await page.getByText("This is an article title").click()
    await page.getByRole('button', {name: "Delete Article"}).first().click()
    await page.getByText('Global Feed').click()

    await expect(page.locator('app-article-list h1').first()).not.toContainText("This is a test title")

})
