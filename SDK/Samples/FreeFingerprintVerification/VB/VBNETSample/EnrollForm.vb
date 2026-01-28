Imports System
Imports System.Collections.Generic
Imports System.ComponentModel
Imports System.Drawing
Imports System.Windows.Forms
Imports System.Reflection

Namespace VBNETSample
	Partial Class EnrollForm
		Inherits Form
		Public Sub New()
			InitializeComponent()
		End Sub

		Public Property UserName() As String
			Get
				Return tbUserName.Text
			End Get
			Set(ByVal value As String)
				tbUserName.Text = Value
			End Set
		End Property
	End Class
End Namespace
