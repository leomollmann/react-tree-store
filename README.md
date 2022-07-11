# Simple state management for React
*A implementation of a sharable state with the observer pattern and without context API*

This package provides you with a way to supply values to React components, a fine control on when to update the components and a architecture proposal for making this shared state scalable and testable. It uses the concept of trees to controll when the components should update by simple `===` comparision of values.

If you liked the concept of this project, feel welcomed to contribute with ideas or code improvements!

---
## How to use

### Step 1: Design your minimal shared state tree.
This is just a JSON valid object that represents what behaviors and data belongs together and needs to integrate with your React app, a shared state that we call *store*. In this example im using the idea of a e-commerce shopping cart.
```ts
export type CartState {
  open: boolean
  products: Product[]
  total: number
  summary: {
    tax: number
    discount: number
    shipping: number
    productsSubtotal: number
  }
}
```

### Step 2: Instantiate your state tree.
Create a file `store.ts` in `src/store/cart/`.
```ts
const initialState: CartState = {
  open: false
  products: []
  summary: {
    tax: 0
    discount: 0
    shipping: 0
    productsSubtotal: 0
    total: 0
  }
}

const cartStore = Store(initialState)
```
### Step 3: Connect to your components.
Consume the state tree fully or partially.
```tsx
// component that is the core concept of the data
function CartComponent() {
    // when any "notify" gets called changes in the state, render this content
    const cart = cartStore.useTree() // CartState

    ...
}
```

```tsx
// component that represents the summary of purchase
function SummaryComponent() {
    // get only the specific path of data and renders only if changed,
    // in this case only if the "summary" object gets reassigned
    const summary = cartStore.useSubtree('summary') // CartState.summary

    ...
}
```

```tsx
// component that represents the cart summary toggle button, it
// may change it style if open or not or display the total
function SummaryComponent() {
    // will only render if any of this two primitives changes
    const total = cartStore.useSubtree('summary.total') // number
    const open = cartStore.useSubtree('open') // boolean

    ...
}
```

### Step 4: Create the actions
Declare the functions that mutates the state in `src/store/cart/actions/<action name>.ts` with this pattern:
```tsx
function toggleCartOpen() {
    // first, get the state to mutate it
    const cart = cartStore.getTree() // CartState

    // the mutation logic
    cart.open = !cart.open

    // at last, batch a React update cicle.
    // any component with the hook "useTree" or 
    // "useSubtree('open')" will re-render
    cartStore.update()
}
```

```tsx
function calculateTotal() {
    // first, get the state to mutate it
    const cart = cartStore.getTree() // CartState

    // 1st section, business logic encapsulated
    // compute total cost of selected products
    const productsSubtotal = _.sum(cart.products.map(x => x.price * x.quantity))
    // compute tax, 5%
    const tax = productsSubtotal * 0.05
    // compute total based on other values
    const total = Math.max(0,
        cart.summary.shipping
        + productsSubtotal
        + tax
        - cart.summary.discount
    )
    
    // 2nd section, defining where in the tree our observers should update
    // by reassignment
    cart.summary = {
        ...cart.summary,
        productsSubtotal,
        total,
        tax
    }

    // at last, batch a React update cicle.
    // any component with the hook "useTree" or 
    // "useSubtree(...)" with 'summary', 'productsSubtotal',
    // 'total' or 'tax' will re-render sice that was the objects that 
    // got either re-assigned or primitives that possibly changed
    cartStore.update()
}
```

This functions can be async and called anywhere, just be sure that you dont make infinite loops and you are good to go.

---
## Testing
With jest is very easy to write unit tests for the actions, you need first to set the state with the desired initial values of the test, call the action, write the test suites and then reset the state with his default values to avoid bugs in the subsequential tests.
```ts
// configure initial state of the test, its based on the default initial state + test changes
const cart = cartStore.getTree()
cart.products = productsMockup // mocked list of products
cart.shipping = 10

// action to be tested
calculateTotal()

// test suites
test('Products Subtotal', () => {
  // 100 * 0.50 + 400 * 0.20 = 50 + 80
  expect(state.productsSubtotal).toBeCloseTo(130)
  expect(state.tax).toBeCloseTo(6.5) // 5% tax
});

test('Total', () => {
  // 130 + 6.5 + 10
  expect(state.total).toBeCloseTo(146.5)
});

cartStore.reset() // reset to initial state
```
