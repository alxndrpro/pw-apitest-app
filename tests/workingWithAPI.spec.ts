import {test, expect, request} from '@playwright/test';
// @ts-ignore
import tags from '../test-data/tags.json'

test.beforeEach(async ({page}) => {
    await page.route('*/**/api/tags', async route => {
        await route.fulfill({
            body: JSON.stringify(tags)
        })
    })

    await page.goto('https://conduit.bondaracademy.com/')
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
    const articleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles', {
        data: {
            "article": {
                "title": "This is an article title",
                "description": "This is an article description",
                "body": "This is an article's body",
                "tagList": []
            }
        }
    })

    expect(articleResponse.status()).toEqual(201)

    await page.getByText('Global Feed').click()
    await page.getByText("This is an article title").click()
    await page.getByRole('button', {name: "Delete Article"}).first().click()
    await page.getByText('Global Feed').click()

    await expect(page.locator('app-article-list h1').first()).not.toContainText("This is a test title")

})

test('Create article', async ({page, request}) => {
    await page.getByText('New Article').click()
    await page.getByRole('textbox', {name: "Article Title"}).fill("Playwright course")
    await page.getByRole('textbox', {name: "What's this article about?"}).fill("Course description")
    await page.getByRole('textbox', {name: "Write your article (in markdown)"}).fill("Course contents")
    await page.getByRole('button', {name: "Publish Article"}).click()
    const articleResponse = await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles')
    const articleResponseBody = await articleResponse.json()
    const slugId = articleResponseBody.article.slug

    await expect(page.locator('.article-page h1')).toContainText("Playwright course")
    await page.getByText('Home').click()
    await page.getByText('Global Feed').click()

    await expect(page.locator('app-article-list h1').first()).toContainText("Playwright course")

    const deleteArticleResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugId}`)

    expect(deleteArticleResponse.status()).toEqual(204)


})
