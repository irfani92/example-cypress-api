describe('Auth module', () => {
  const userData = {
    name: 'John Doe',
    email: 'john@nest.test',
    password: 'Secret_123',
  }

  describe('Register', () => {
    /**
     * 1. error validation (null name, email and password)
     * 2. error invalid email format
     * 3. error invalid password format
     * 4. registered successfully
     * 5. error duplicate entry
     */

    it('should return error messages for validation', () => {
      cy.request({
        method: 'POST',
        url: '/auth/register',
        failOnStatusCode: false,
      }).then((response) => {
        // expect(response.status).to.eq(400)
        // expect(response.body.error).to.eq('Bad Request')
        // expect('name should not be empty').to.be.oneOf(response.body.message)
        // expect('email should not be empty').to.be.oneOf(response.body.message)
        // expect('password should not be empty').to.be.oneOf(
        //   response.body.message,
        // )
        cy.badRequest(response, [
          'name should not be empty',
          'email should not be empty',
          'password should not be empty',
        ])
      })
    })

    it('should return error message for invalid email format', () => {
      cy.request({
        method: 'POST',
        url: '/auth/register',
        body: {
          name: userData.name,
          email: 'john @ nest.test',
          password: userData.password,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.badRequest(response, ['email must be an email'])
      })
    })

    it('should return error message for invalid password format', () => {
      cy.request({
        method: 'POST',
        url: '/auth/register',
        body: {
          name: userData.name,
          email: userData.email,
          password: 'invaidpassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.badRequest(response, ['password is not strong enough'])
      })
    })

    it('should successfully registered', () => {
      cy.resetUsers()
      cy.request({
        method: 'POST',
        url: '/auth/register',
        body: userData,
      }).then((response) => {
        const { id, name, email, password } = response.body.data
        expect(response.status).to.eq(201)
        expect(response.body.success).to.be.true
        expect(id).not.to.be.undefined
        expect(name).to.eq('John Doe')
        expect(email).to.eq('john@nest.test')
        expect(password).to.be.undefined
      })
    })

    it('should return error because of duplicate email', () => {
      cy.request({
        method: 'POST',
        url: '/auth/register',
        body: userData,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(500)
        expect(response.body.success).to.be.false
        expect(response.body.message).to.eq('Email already exists')
      })
    })
  })

  describe('Login', () => {
    /**
     * 1. unauthorized on failed
     * 2. return access token on success
     */

    it('should return unauthorized on failed', () => {
      cy.request({
        method: 'POST',
        url: '/auth/login',
        failOnStatusCode: false,
      }).then((response) => {
        cy.unauthorized(response)
      })

      cy.request({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: userData.email,
          password: 'wrong password',
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.unauthorized(response)
      })
    })

    it('should return access token on success', () => {
      cy.request({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: userData.email,
          password: userData.password,
        },
      }).then((response) => {
        expect(response.body.success).to.be.true
        expect(response.body.message).to.eq('Login success')
        expect(response.body.data.access_token).not.to.be.undefined
      })
    })
  })

  describe('Me', () => {
    /**
     * 1. error unauthorized
     * 2. return correct current data
     */

    before('do login', () => {
      cy.login()
    })

    it('should return unauthorized when send no token', () => {
      cy.checkUnauthorized('GET', '/auth/me')
    })

    it('should return correct current data', () => {
      cy.request({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        const { id, name, email, password } = response.body.data
        expect(response.status).to.eq(200)
        expect(response.body.success).to.be.true
        expect(id).not.to.be.undefined
        expect(name).to.eq(userData.name)
        expect(email).to.eq(userData.email)
        expect(password).to.be.undefined
      })
    })
  })
})
