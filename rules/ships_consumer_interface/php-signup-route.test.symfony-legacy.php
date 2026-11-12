<?php
// lexcode-expect: 3
// Public sign-up routes in Symfony through the older Annotation class imported by name and written
// fully qualified, and the Attribute class through an alias.
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Attribute\Route as AttributeRoute;

class SignupController extends AbstractController
{
    #[Route('/register', name: 'signup_register')]
    public function register(): Response
    {
        return $this->render('signup/register.html.twig');
    }

    #[\Symfony\Component\Routing\Annotation\Route('/registration', name: 'signup_registration')]
    public function registration(): Response
    {
        return $this->redirectToRoute('signup_register');
    }

    #[AttributeRoute(path: '/sign-up', name: 'signup_short')]
    public function short(): Response
    {
        return $this->redirectToRoute('signup_register');
    }
}
