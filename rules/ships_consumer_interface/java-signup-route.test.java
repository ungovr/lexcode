// lexcode-expect: 7
// A public sign-up page and endpoint, as Spring MVC, JAX-RS and servlet routes.
package demo.web;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
class RegistrationController {

  @GetMapping("/register")
  String form() {
    return "register";
  }

  @PostMapping("/register")
  String submit(String email) {
    return "redirect:/welcome";
  }

  @PostMapping(value = "/api/v1/signup")
  String signup(String email) {
    return "welcome";
  }

  @RequestMapping(path = "/users/sign-up", method = RequestMethod.POST)
  String legacy(String email) {
    return "welcome";
  }
}

@Path("/accounts/registration")
class AccountResource {

  @POST
  public String create(String email) {
    return email;
  }
}

@WebServlet("/signup")
class SignupServlet extends HttpServlet {
}

@WebServlet(urlPatterns = {"/create-account"})
class CreateAccountServlet extends HttpServlet {
}
