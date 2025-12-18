# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - img [ref=e8]
    - heading "Welcome back" [level=2] [ref=e10]
    - paragraph [ref=e11]: Sign in to your account
  - generic [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: Email address
        - generic [ref=e16]:
          - generic:
            - img
          - textbox "Email address" [ref=e17]:
            - /placeholder: you@example.com
      - generic [ref=e18]:
        - generic [ref=e19]: Password
        - generic [ref=e20]:
          - generic:
            - img
          - textbox "Password" [ref=e21]:
            - /placeholder: ••••••••
          - button [ref=e22] [cursor=pointer]:
            - img [ref=e23]
      - link "Forgot your password?" [ref=e28] [cursor=pointer]:
        - /url: /forgot-password
      - button "Sign in" [ref=e29] [cursor=pointer]
      - generic [ref=e34]: Or continue with
      - button "Continue with Google" [ref=e36] [cursor=pointer]:
        - img [ref=e38]
        - text: Continue with Google
    - paragraph [ref=e44]:
      - text: Don't have an account?
      - link "Sign up now" [ref=e45] [cursor=pointer]:
        - /url: /register
```