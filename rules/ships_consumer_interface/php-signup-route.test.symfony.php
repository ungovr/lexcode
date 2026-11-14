<?php
// lexcode-expect: 4
// Public sign-up routes in Symfony: the Route attribute imported by name, the older Annotation
// class through an alias, and the attribute written fully qualified, with the path given
// positionally and by name.
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route as LegacyRoute;
use Symfony\Component\Routing\Attribute\Route;

class RegistrationController extends AbstractController
{
    #[Route('/register', name: 'app_register')]
    public function register(Request $request): Response
    {
        return $this->render('registration/register.html.twig');
    }

    #[Route(path: '/{_locale}/sign-up', name: 'app_signup_localized')]
    public function localized(): Response
    {
        return $this->redirectToRoute('app_register');
    }

    #[Route(name: 'app_signup', path: '/sign-up', methods: ['GET', 'POST'])]
    public function signup(): Response
    {
        return $this->redirectToRoute('app_register');
    }

    #[LegacyRoute('/registration', name: 'app_registration')]
    public function legacy(): Response
    {
        return $this->redirectToRoute('app_register');
    }

    #[\Symfony\Component\Routing\Attribute\Route('/create-account', name: 'app_create_account')]
    public function createAccount(): Response
    {
        return $this->redirectToRoute('app_register');
    }
}
