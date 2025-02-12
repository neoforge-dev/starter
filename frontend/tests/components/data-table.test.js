import { test, expect } from "@playwright/test";

test.describe("DataTable Component", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-datatable--basic"
    );
  });

  test("renders basic table", async ({ page }) => {
    const table = page.locator("neo-data-table");
    await expect(table).toBeVisible();
    const headers = table.locator("th");
    await expect(headers).toHaveCount(5); // Name, Email, Role, Status, Last Login
  });

  test("handles sorting", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-datatable--sortable"
    );
    const table = page.locator("neo-data-table");
    const nameHeader = table.locator("th", { hasText: "Name" });

    // Click to sort ascending
    await nameHeader.click();
    let firstRow = table.locator("tbody tr").first();
    await expect(firstRow).toContainText("Bob Wilson");

    // Click again to sort descending
    await nameHeader.click();
    firstRow = table.locator("tbody tr").first();
    await expect(firstRow).toContainText("User");
  });

  test("handles filtering", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-datatable--filterable"
    );
    const table = page.locator("neo-data-table");
    const filterInput = table.locator('input[placeholder="Filter name"]');

    await filterInput.fill("John");
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("John Doe");
  });

  test("handles pagination", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-datatable--pageable"
    );
    const table = page.locator("neo-data-table");

    // Check initial page
    let rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(10);

    // Go to next page
    await table.locator("button", { hasText: "Next" }).click();
    rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(10);

    // Change page size
    const pageSizeSelect = table.locator("select").first();
    await pageSizeSelect.selectOption("25");
    rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(25);
  });

  test("handles row selection", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-datatable--selectable"
    );
    const table = page.locator("neo-data-table");

    // Select first row
    const firstRowCheckbox = table
      .locator("tbody tr")
      .first()
      .locator("input[type=checkbox]");
    await firstRowCheckbox.check();
    await expect(table.locator(".table-toolbar")).toContainText(
      "1 row selected"
    );

    // Select all rows
    const selectAllCheckbox = table.locator("thead input[type=checkbox]");
    await selectAllCheckbox.check();
    await expect(table.locator(".table-toolbar")).toContainText(
      "10 rows selected"
    );
  });

  test("handles column resizing", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-datatable--full-featured"
    );
    const table = page.locator("neo-data-table");
    const nameColumn = table.locator("th", { hasText: "Name" });
    const resizer = nameColumn.locator(".resizer");

    // Get initial width
    const initialWidth = await nameColumn.evaluate((el) => el.offsetWidth);

    // Resize column
    await resizer.hover();
    await page.mouse.down();
    await page.mouse.move(500, 0);
    await page.mouse.up();

    // Check new width
    const newWidth = await nameColumn.evaluate((el) => el.offsetWidth);
    expect(newWidth).toBeGreaterThan(initialWidth);
  });

  test("handles complex filtering", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-datatable--filterable"
    );
    const table = page.locator("neo-data-table");

    // Test number filter
    const roleFilter = table.locator("select.filter-operator").nth(2);
    await roleFilter.selectOption("equals");
    const roleInput = table.locator('input[placeholder="Filter role"]');
    await roleInput.fill("Admin");

    // Check filtered results
    const rows = table.locator("tbody tr");
    await expect(rows.first()).toContainText("Admin");
  });

  test("handles empty state", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-datatable--empty"
    );
    const table = page.locator("neo-data-table");
    const emptyMessage = table.locator(".empty-message");
    await expect(emptyMessage).toBeVisible();
    await expect(emptyMessage).toContainText("No data available");
  });

  test("handles loading state", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-datatable--loading"
    );
    const table = page.locator("neo-data-table");
    await expect(table).toHaveAttribute("loading", "");
  });

  test("handles sticky header", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-datatable--full-featured"
    );
    const table = page.locator("neo-data-table");
    const header = table.locator("thead");

    // Check if header is sticky
    const isSticky = await header.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.position === "sticky";
    });

    expect(isSticky).toBeTruthy();
  });

  test("handles custom cell templates", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-datatable--full-featured"
    );
    const table = page.locator("neo-data-table");

    // Check status cell template
    const statusCell = table.locator("td span").first();
    await expect(statusCell).toHaveCSS("background-color", "rgb(5, 150, 105)"); // Success color
  });

  test("handles keyboard navigation", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-datatable--full-featured"
    );
    const table = page.locator("neo-data-table");

    // Focus first cell
    await table.locator("tbody tr").first().click();

    // Navigate with keyboard
    await page.keyboard.press("Tab");
    await page.keyboard.press("Space");

    // Check if row is selected
    const firstRowCheckbox = table
      .locator("tbody tr")
      .first()
      .locator("input[type=checkbox]");
    await expect(firstRowCheckbox).toBeChecked();
  });
});
