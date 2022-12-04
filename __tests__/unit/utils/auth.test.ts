import { generatePepper, generateSalt, tryGetPepperAndRefresh, PepperItem, addSaltToPassword } from "../../../src/utils/auth";

describe("generateSalt", () => {
    it("should generate a salt", () => {
        const salt = generateSalt();
        expect(salt).toHaveLength(88);
    });
    it("should generate a different salt each time", () => {
        const salt1 = generateSalt();
        const salt2 = generateSalt();
        expect(salt1).not.toEqual(salt2);
    });
});

describe("generatePepper", () => {
    it("should generate a pepper", () => {
        const pepper = generatePepper();
        expect(pepper).toHaveLength(88);
    });
    it("should generate a different pepper each time", () => {
        const pepper1 = generatePepper();
        const pepper2 = generatePepper();
        expect(pepper1).not.toEqual(pepper2);
    });
});

describe("tryGetPepper", () => {

    it("should return the pepper if it's not expired", async () => {
        const pepperItem = {
            pepper: "pepper",
            expires: Date.now() + 1000
        } as PepperItem;
        const pepper = await tryGetPepperAndRefresh(pepperItem, {} as any);
        expect(pepper).toEqual("pepper");
    });

    it("should call <getPepperItem> if the pepper is expired", async () => {
        const pepperItem = {
            pepper: "pepper",
            expires: Date.now() - 1000
        } as PepperItem;

        const newPepperItem = {
            pepper: "newPepper",
            expires: Date.now() + 1000
        } as PepperItem;

        const getPepperItem = jest.fn().mockResolvedValue(newPepperItem);
        const pepper = await tryGetPepperAndRefresh(pepperItem, {} as any, getPepperItem);

        expect(getPepperItem).toHaveBeenCalled();
        expect(pepper).toEqual("newPepper");
    });

    it("should call <refreshPepperItem> if <getPepperItem> returns null", async () => {
        const pepperItem = {
            pepper: "pepper",
            expires: Date.now() - 1000
        } as PepperItem;

        const newPepperItem = {
            pepper: "newPepper",
            expires: Date.now() + 1000
        } as PepperItem;

        const getPepperItem = jest.fn().mockResolvedValue(null);
        const refreshPepperItem = jest.fn().mockResolvedValue(newPepperItem);
        const pepper = await tryGetPepperAndRefresh(pepperItem, {} as any, getPepperItem, refreshPepperItem);

        expect(getPepperItem).toHaveBeenCalled();
        expect(refreshPepperItem).toHaveBeenCalled();
        expect(pepper).toEqual("newPepper");
    });

    it("should return null if <getPepperItem> and <refreshPepperItem> return null", async () => {
        const pepperItem = {
            pepper: "pepper",
            expires: Date.now() - 1000
        } as PepperItem;

        const getPepperItem = jest.fn().mockResolvedValue(null);
        const refreshPepperItem = jest.fn().mockResolvedValue(null);
        const pepper = await tryGetPepperAndRefresh(pepperItem, {} as any, getPepperItem, refreshPepperItem);

        expect(getPepperItem).toHaveBeenCalled();
        expect(refreshPepperItem).toHaveBeenCalled();
        expect(pepper).toBeNull();
    });
});

describe("addSaltToPassword", () => {
    it("should add the salt to the password", async () => {
        const password = "password";
        const saltedPassword = await addSaltToPassword("salt1", password);

        expect(saltedPassword).toHaveLength(88);
    });

    it("should be the same for the same salt and password", async () => {
        const password = "password";
        const saltedPassword1 = await addSaltToPassword("salt1", password);
        const saltedPassword2 = await addSaltToPassword("salt1", password);

        expect(saltedPassword1).toEqual(saltedPassword2);
    });
});