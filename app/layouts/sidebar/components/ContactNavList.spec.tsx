import type { ContactMutation } from "@app/data";
import { render, screen } from "@testing-utils";
import { MemoryRouter } from "react-router";
import type { Navigation } from "react-router";
import { describe, expect, it } from "vitest";
import { ContactNavList } from "./ContactNavList";

const renderContactNavList = (contacts: ContactMutation[], navigationState: Navigation["state"] = "idle") => {
  return render(
    <MemoryRouter>
      <ContactNavList contacts={contacts} navigationState={navigationState} />
    </MemoryRouter>,
  );
};

const mockContacts: ContactMutation[] = [
  { id: "1", first: "John", last: "Doe", favorite: true },
  { id: "2", first: "Jane", last: "Smith", favorite: false },
  { id: "3" /* No name */, favorite: false },
];

describe("ContactNavList コンポーネント", () => {
  it("連絡先リストが空の場合に「No contacts」と表示する", () => {
    renderContactNavList([], "idle");
    expect(screen.getByText(/No contacts/i)).toBeInTheDocument();
  });

  it("連絡先リストに名前とお気に入りインジケータを表示する", () => {
    renderContactNavList(mockContacts, "idle");

    // Check first contact
    const contact1Link = screen.getByRole("link", { name: "John Doe ★" });
    expect(contact1Link).toBeInTheDocument();
    expect(contact1Link).toHaveAttribute("href", "/contacts/1");

    // Check second contact
    const contact2Link = screen.getByRole("link", { name: "Jane Smith" });
    expect(contact2Link).toBeInTheDocument();
    expect(contact2Link).toHaveAttribute("href", "/contacts/2");

    // Check third contact (No Name)
    const contact3Link = screen.getByRole("link", { name: "No Name" });
    expect(contact3Link).toBeInTheDocument();
    expect(contact3Link).toHaveAttribute("href", "/contacts/3");
  });

  it("名または姓がない連絡先には「No Name」と表示する", () => {
    const noNameContact: ContactMutation[] = [{ id: "4", favorite: false }];
    renderContactNavList(noNameContact, "idle");
    expect(screen.getByRole("link", { name: "No Name" })).toBeInTheDocument();
  });

  it("お気に入りの連絡先には星（★）を表示する", () => {
    const favoriteContact: ContactMutation[] = [{ id: "5", first: "Fav", last: "User", favorite: true }];
    renderContactNavList(favoriteContact, "idle");
    const link = screen.getByRole("link", { name: "Fav User ★" });
    expect(link).toBeInTheDocument();
  });

  it("お気に入りでない連絡先には星を表示しない", () => {
    const nonFavoriteContact: ContactMutation[] = [{ id: "6", first: "NonFav", last: "User", favorite: false }];
    renderContactNavList(nonFavoriteContact, "idle");
    const link = screen.getByRole("link", { name: "NonFav User" });
    expect(link.textContent).not.toContain("★");
  });

  // it("navigationStateが'loading'の場合にNavLinkがdisabledになる", () => {
  //   renderContactNavList([mockContacts[0]], "loading");
  //   const link = screen.getByRole("link", { name: "John Doe ★" });
  //   expect(link).toHaveAttribute("aria-disabled", "true");
  // });

  // it("navigationStateが'idle'の場合にNavLinkがdisabledにならない", () => {
  //   renderContactNavList([mockContacts[0]], "idle");
  //   const link = screen.getByRole("link", { name: "John Doe ★" });
  //   expect(link).not.toHaveAttribute("aria-disabled", "true");
  // });
});
