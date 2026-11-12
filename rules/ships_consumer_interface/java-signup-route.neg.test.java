// lexcode-expect: 0
// Not a public sign-up: staff-only account tools, sign-in, a registry of vehicles,
// and a route that only mentions the word in another sense.
package demo.web;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin/users")
class AdminUserController {

  @PostMapping("/register")
  String invite(String email) {
    return "redirect:/admin/users";
  }
}

@Controller
@RequestMapping("/staff")
class StaffController {

  @GetMapping("/signup")
  String newStaff() {
    return "staff/new";
  }
}

@Controller
class LoginController {

  @GetMapping("/login")
  String login() {
    return "login";
  }

  @PostMapping("/logout")
  String logout() {
    return "redirect:/";
  }
}

@Controller
class VehicleController {

  @PostMapping("/vehicles/registration")
  String registerVehicle(String plate) {
    return "redirect:/vehicles";
  }

  @PostMapping("/registrations/export")
  String export() {
    return "export";
  }
}

@Controller
class OperatorController {

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/register")
  String addOperator(String email) {
    return "redirect:/operators";
  }
}
