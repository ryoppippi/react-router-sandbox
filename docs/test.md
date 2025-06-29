# Vitest プロジェクト テスト実装・設計方針ドキュメント

このドキュメントは、提供されたファイル情報および過去の対話履歴に基づいて、プロジェクトのコードベースから推測される Vitest を用いたテストの実装方針、設計規約、およびベストプラクティスをまとめたものです。

## 1. テストファイルの構造と命名規約

-   **ファイル配置パターン（e.g. `__tests__` vs `.test.ts` vs `.spec.ts`）：**
    -   テストファイルは、テスト対象のソースファイルと同じディレクトリ内に配置されます（コロケーション）。
    -   ファイル名は `[対象ファイル名].spec.ts` または `[対象ファイル名].spec.tsx` の形式が採用されています (例: `ErrorBoundary.spec.tsx`, `ContactNavList.spec.tsx`)。
-   **テストスイート名 / テストケース名の命名方針：**
    -   **テストスイート (`describe` ブロック）：**
        -   日本語で記述され、テスト対象のコンポーネント名やモジュール名を含みます (例: `describe("ErrorBoundary", () => { ... });`)。
        -   対象の機能や役割を明確に示す名称が付けられています。
    -   **テストケース (`it` ブロック）：**
        -   日本語で記述され、テストする具体的な振る舞いや期待される結果を明確に示します (例: `it("handles route error response: 404", () => { ... });`)。
        -   特定の条件下でのコンポーネントのレンダリング結果や、関数の動作を検証する意図が明確です。

## 2. テスト記法と粒度方針

-   **`describe / it` の粒度レベルと構造の傾向：**
    -   `describe` は、1つのコンポーネント (例: `ErrorBoundary`)、1つの関数（例: `loader`, `action`）、または関連する機能群をテスト対象とする単位で使用されます。
    -   `it` は、`describe` 内で個別のテストシナリオやアサーションの単位として使用されます。各 `it` ブロックは、特定の入力や状態に対する1つの期待される振る舞いを検証することに焦点を当てています (例: `ErrorBoundary.spec.tsx` では、異なるエラータイプごとに `it` ブロックが定義されています)。
-   **AAA（Arrange-Act-Assert）やGWTパターンの徹底度：**
    -   AAA (Arrange-Act-Assert) パターンが一貫して適用されていると考えられます。
        -   **Arrange (準備):** テストに必要なデータ（モックエラーオブジェクト）、コンポーネントのprops、モック関数 (`vi.mock` で `isRouteErrorResponse` をモック) などを準備します。
        -   **Act (実行):** コンポーネントをレンダリング (`render(<ErrorBoundary error={error} params={{}} />)`) したり、特定の関数を実行したりします。
        -   **Assert (検証):** `expect` を使用して、実行結果が期待通りであることを検証します (`@testing-library/jest-dom` のマッチャー (`toBeInTheDocument`, `getByRole` など) が活用されます)。
    -   GWT (Given-When-Then) パターンも、テストケース名や構造から暗黙的に意識されている可能性があります。

## 3. モック戦略と依存切り離し方針

-   **`vi.mock` / `vi.fn` / MSW などの使い分け方針：**
    -   `vi.mock(modulePath, factory?)`: モジュール全体をモックするために使用されます。例: `ErrorBoundary.spec.tsx` では `react-router` モジュールの `isRouteErrorResponse` 関数をモック。ファクトリ関数内で具体的なモック実装 (`vi.fn()`) を提供します。
    -   `vi.fn()`: 個別の関数やメソッドのスタブを作成し、呼び出し回数、引数、戻り値などをスパイするために使用されます。`vi.mock` のファクトリ関数内で返されるモック関数として利用されます。
    -   `vi.spyOn(object, methodName)`: 既存オブジェクトのメソッドの動作を監視したり、実装を上書きしたりするために使用されます。例えば、データ層の関数 (`app/data.ts`) をモックする際に活用できます。
    -   MSW (Mock Service Worker): 現時点のファイル情報からは使用は確認されていません。APIリクエストのモックは、データ層の関数を直接モックすることで対応していると推測されます。
-   **外部API / ライブラリ依存のスタブ化方法：**
    -   **データ層 (`app/data.ts`):** `loader` や `action` のテストでは、データ層の関数 (例: `getContacts`) が `vi.mock` や `vi.spyOn` を用いてモックされ、テストシナリオに応じた固定値を返すように制御されることがあります。
    -   **React Router:**
        -   コンポーネントテストでは、`<MemoryRouter>` や `createMemoryRouter` + `<RouterProvider>` を使用してルーティングコンテキストを提供します。
        -   `isRouteErrorResponse` のようなユーティリティ関数は `vi.mock` でモックされることがあります (例: `ErrorBoundary.spec.tsx`)。
        -   `useLoaderData`, `useNavigate`, `useFetcher` などのフックも、必要に応じて `vi.mock` でモックされることがあります。
    -   **環境変数:** `app/root/components/ErrorBoundary.tsx` が `import.meta.env.DEV` を使用しています。テストにおいて環境変数に依存するロジックを制御する必要がある場合、その変数が使われるモジュールや関数をモックするか、Vitestの環境変数設定機能（例: `vi.stubEnv`）を利用して値を設定することが考えられます。(`ErrorBoundary.spec.tsx` では、`isRouteErrorResponse` をモックすることで関連ロジックのテストパスを制御しています。)

## 4. DOMとの統合テスト（必要な場合）

-   **`@testing-library/react` 等との併用方針：**
    -   `@testing-library/react` が全面的に採用されており (`package.json` に記載、`ErrorBoundary.spec.tsx` で使用)、Reactコンポーネントのテストにおける主要なツールとなっています。
    -   `@testing-library/jest-dom` が `setupTests.ts` でインポートされ、DOM要素に対するカスタムマッチャーを提供しています。
    -   ユーザーの視点に近い形でテストを記述することが重視され、コンポーネントの内部実装ではなく、レンダリング結果やインタラクションを通じた振る舞いを検証します。
-   **`userEvent` / `screen` / `render` のパターン：**
    -   `render`: テスト対象のコンポーネントをDOMにレンダリングするために使用されます (`ErrorBoundary.spec.tsx`)。
    -   `screen`: レンダリングされたDOMに対してクエリを実行するためのユーティリティオブジェクトです (`screen.getByRole`, `screen.getByText` などが `ErrorBoundary.spec.tsx` で使用されています)。
    -   `userEvent` (`@testing-library/user-event`): `package.json` に依存関係として記載されており、クリック、入力などのユーザーインタラクションをシミュレートするために使用されると推測されます。
    -   クエリは、アクセシビリティ属性（ロール、ラベル、テキストコンテンツなど）に基づいて要素を選択することが推奨され、実践されています。

## 5. グローバル設定・初期化戦略

-   **`setupFiles` / `globalSetup` の設計意図と内容：**
    -   `setupTests.ts` ファイルでは `import "@testing-library/jest-dom";` が実行され、`expect` に `toBeInTheDocument` などのカスタムDOMマッチャーをグローバルに追加しています。
-   **テスト前の環境初期化（e.g. localStorage / env）方針：**
    -   `ErrorBoundary.spec.tsx` の `beforeEach` フックでは、`vi.clearAllMocks()` と `(isRouteErrorResponse as unknown as MockedFunction<typeof isRouteErrorResponse>).mockReset()` が実行され、テストケース間でモックの状態がリセットされています。
    -   `jsdom` 環境が使用されているため、`localStorage` や `sessionStorage` などのブラウザAPIはテスト実行時に利用可能です。

## 7. その他の観察された実装方針

-   **snapshotテストの使用有無と用途：**
    -   提供されたファイルや過去の対話からは、スナップショットテスト (`*.snap` ファイルや `toMatchSnapshot()`) の積極的な使用は確認されていません。UIコンポーネントの構造変動を検知するよりも、具体的な振る舞いや属性値を検証するアプローチが主体のようです。

## 注意点と補足

-   **Jestからの移行があればその痕跡と互換設定を示してください。**
    -   現時点では、Jestからの移行を示す明確な痕跡（例: `jest.config.js` の残骸、Jest特有のAPIの使用）は見当たりません。VitestネイティブのAPI (`vi.*` など) が使用されています。
-   **曖昧な慣習や粒度のブレがある場合は、その混在状況も明示してください。**
    -   テストコンポーネントのレンダリング時のルーターラッパーとして、`<MemoryRouter>` と `createMemoryRouter` + `<RouterProvider>` の両方が使用可能です。後者がReact Router v6.4+ の推奨パターンであり、プロジェクト内で統一することが望ましい場合があります。
    -   それ以外には、テストの記述スタイルやモック戦略に関して、大きなブレや曖昧な慣習は現時点では観察されていません。
-   **一貫したテスト観点・方針がない場合はその旨も率直に記述してください。**
    -   全体として、コンポーネントの振る舞いとユーザーインタラクションに焦点を当てたテスト (`@testing-library/react` の哲学に沿ったもの)、および `loader`/`action` のようなロジック部分のユニットテストという、明確で一貫した方針が見られます。
