import FormService from "@repo/services/forms";
import ResponseService from "@repo/services/responses";
import UserService from "@repo/services/user";

export const userService = new UserService();
export const formService = new FormService();
export const responseService = new ResponseService();
